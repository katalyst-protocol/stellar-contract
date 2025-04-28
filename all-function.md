CDRB4IWTMF5DAXVWMYVBWHCCLMVG62PDZL7VSYOXGMU6PMLC4GOZWFLI

```
#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, Map, Symbol, Vec};

#[contract]
pub struct LendingContract;

const USER_DEPOSITS: Symbol = symbol_short!("udeposits");
const USER_BORROWS: Symbol = symbol_short!("uborrows");
const TOTAL_DEPOSITS: Symbol = symbol_short!("tdeposits");
const COLLATERAL_FACTORS: Symbol = symbol_short!("cfactor");
const LTV_VALUES: Symbol = symbol_short!("ltv");
const LIQ_THRESHOLDS: Symbol = symbol_short!("liqthresh");
const LIQ_BONUSES: Symbol = symbol_short!("liqbonus");
const USER_COLLATERAL: Symbol = symbol_short!("ucolate");
const LTV_RATIOS: Symbol = symbol_short!("ltv");
const INTEREST_MODELS: Symbol = symbol_short!("imodel");
const RESERVE_FACTORS: Symbol = symbol_short!("reserve");
const TREASURY_ADDR: Symbol = symbol_short!("treasury");
const SUPPORTED_ASSETS: Symbol = symbol_short!("assets");
const CONTRACT_PAUSED: Symbol = symbol_short!("paused");

#[contractimpl]
impl LendingContract {
    fn get_user_deposits(env: &Env) -> Map<(Address, Address), i128> {
        env.storage()
            .persistent()
            .get(&USER_DEPOSITS)
            .unwrap_or(Map::new(env))
    }

    fn get_user_borrows(env: &Env) -> Map<(Address, Address), i128> {
        env.storage()
            .persistent()
            .get(&USER_BORROWS)
            .unwrap_or(Map::new(env))
    }

    fn get_total_deposits(env: &Env) -> Map<Address, i128> {
        env.storage()
            .persistent()
            .get(&TOTAL_DEPOSITS)
            .unwrap_or(Map::new(env))
    }

    fn save_user_deposits(env: &Env, data: Map<(Address, Address), i128>) {
        env.storage().persistent().set(&USER_DEPOSITS, &data);
    }

    fn save_user_borrows(env: &Env, data: Map<(Address, Address), i128>) {
        env.storage().persistent().set(&USER_BORROWS, &data);
    }

    fn save_total_deposits(env: &Env, data: Map<Address, i128>) {
        env.storage().persistent().set(&TOTAL_DEPOSITS, &data);
    }

    pub fn deposit(env: Env, user: Address, token: Address, amount: i128) {
        assert!(amount > 0, "Amount must be > 0");

        let token_client = token::Client::new(&env, &token);

        // Pull tokens from user to contract
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        let mut user_deposits = Self::get_user_deposits(&env);
        let mut total_deposits = Self::get_total_deposits(&env);

        let key = (user.clone(), token.clone());
        let new_deposit = user_deposits.get(key.clone()).unwrap_or(0) + amount;
        user_deposits.set(key, new_deposit);

        let new_total = total_deposits.get(token.clone()).unwrap_or(0) + amount;
        total_deposits.set(token, new_total);

        Self::save_user_deposits(&env, user_deposits);
        Self::save_total_deposits(&env, total_deposits);
    }

    pub fn withdraw(env: Env, user: Address, token: Address, amount: i128) {
        assert!(amount > 0, "Amount must be > 0");
        let token_client = token::Client::new(&env, &token);

        let mut user_deposits = Self::get_user_deposits(&env);
        let mut total_deposits = Self::get_total_deposits(&env);

        let key = (user.clone(), token.clone());
        let current = user_deposits.get(key.clone()).unwrap_or(0);
        assert!(current >= amount, "Insufficient balance");

        user_deposits.set(key, current - amount);

        let pool = total_deposits.get(token.clone()).unwrap_or(0) - amount;
        total_deposits.set(token.clone(), pool);

        // Transfer asset from contract to user
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        Self::save_user_deposits(&env, user_deposits);
        Self::save_total_deposits(&env, total_deposits);
    }

    pub fn borrow(env: Env, user: Address, token: Address, amount: i128) {
        assert!(amount > 0, "Amount must be > 0");

        let token_client = token::Client::new(&env, &token);

        let user_deposits = Self::get_user_deposits(&env);
        let mut user_borrows = Self::get_user_borrows(&env);

        let deposit_key = (user.clone(), token.clone());
        let borrow_key = (user.clone(), token.clone());

        let deposited = user_deposits.get(deposit_key).unwrap_or(0);
        let borrowed = user_borrows.get(borrow_key.clone()).unwrap_or(0);

        let max_borrow = deposited * 70 / 100;
        assert!(borrowed + amount <= max_borrow, "Exceeds max borrow limit");

        user_borrows.set(borrow_key.clone(), borrowed + amount);

        // Send asset to user
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        Self::save_user_borrows(&env, user_borrows);
    }

    pub fn repay(env: Env, user: Address, token: Address, amount: i128) {
        assert!(amount > 0, "Amount must be > 0");

        let token_client = token::Client::new(&env, &token);

        let mut user_borrows = Self::get_user_borrows(&env);

        let key = (user.clone(), token.clone());
        let borrowed = user_borrows.get(key.clone()).unwrap_or(0);
        assert!(borrowed > 0, "Nothing to repay");

        let repay_amount = if amount > borrowed { borrowed } else { amount };

        // Pull tokens from user to contract
        token_client.transfer(&user, &env.current_contract_address(), &repay_amount);

        user_borrows.set(key.clone(), borrowed - repay_amount);

        Self::save_user_borrows(&env, user_borrows);
    }

    pub fn get_user_balances(env: Env, user: Address, asset: Address) -> (i128, i128) {
        let user_deposits = Self::get_user_deposits(&env);
        let user_borrows = Self::get_user_borrows(&env);
        let deposit = user_deposits
            .get((user.clone(), asset.clone()))
            .unwrap_or(0);
        let borrow = user_borrows.get((user, asset)).unwrap_or(0);
        (deposit, borrow)
    }

    pub fn add_supported_asset(env: Env, admin: Address, asset: Address) {
        Self::require_admin(&env, &admin);
        let mut list = env
            .storage()
            .persistent()
            .get(&SUPPORTED_ASSETS)
            .unwrap_or(Vec::new(&env));
        if !list.contains(&asset) {
            list.push_back(asset);
        }
        env.storage().persistent().set(&SUPPORTED_ASSETS, &list);
    }

    // Phase 2
    /*
    - depositCollateral(asset, amount)
    - withdrawCollateral(asset, amount)
    - getUserCollateralValue(address)
    - getUserDebtValue(address)
    - getHealthFactor(address)
    // admin control
    - setCollateralFactor(asset, factor)
    - setLTV(asset, ltv)
    - setLiquidationThreshold(asset, threshold)
    - setLiquidationBonus(asset, bonus)

     */

    fn require_not_paused(env: &Env) {
        let paused: bool = env
            .storage()
            .persistent()
            .get(&CONTRACT_PAUSED)
            .unwrap_or(false.into());
        assert!(!paused, "Contract is paused");
    }

    fn require_admin(env: &Env, caller: &Address) {
        let treasury: Address = env
            .storage()
            .persistent()
            .get(&TREASURY_ADDR)
            .expect("Treasury not set");
        assert!(caller == &treasury, "Not authorized");
    }

    pub fn deposit_collateral(env: Env, user: Address, asset: Address, amount: i128) {
        Self::require_not_paused(&env);
        Self::deposit(env, user, asset, amount);
    }

    pub fn withdraw_collateral(env: Env, user: Address, asset: Address, amount: i128) {
        Self::require_not_paused(&env);
        Self::withdraw(env, user, asset, amount);
    }

    pub fn get_user_collateral_value(env: Env, user: Address) -> i128 {
        let deposits = Self::get_user_deposits(&env);
        let coll_factors: Map<Address, i128> = env
            .storage()
            .persistent()
            .get(&COLLATERAL_FACTORS)
            .unwrap_or(Map::new(&env));
        let supported: Vec<Address> = env
            .storage()
            .persistent()
            .get(&SUPPORTED_ASSETS)
            .unwrap_or(Vec::new(&env));

        let mut total = 0;
        for asset in supported.iter() {
            let key = (user.clone(), asset.clone());
            let amount = deposits.get(key).unwrap_or(0);
            let factor = coll_factors.get(asset.clone()).unwrap_or(0);
            total += amount * factor / 100;
        }
        total
    }

    pub fn get_user_debt_value(env: Env, user: Address) -> i128 {
        let borrows = Self::get_user_borrows(&env);
        let supported: Vec<Address> = env
            .storage()
            .persistent()
            .get(&SUPPORTED_ASSETS)
            .unwrap_or(Vec::new(&env));

        let mut total = 0;
        for asset in supported.iter() {
            let key = (user.clone(), asset.clone());
            let amount = borrows.get(key).unwrap_or(0);
            total += amount;
        }
        total
    }

    pub fn get_health_factor(env: Env, user: Address) -> i128 {
        let collateral_value = Self::get_user_collateral_value(env.clone(), user.clone());
        let debt_value = Self::get_user_debt_value(env, user);
        if debt_value == 0 {
            return i128::MAX;
        }
        collateral_value * 100 / debt_value
    }

    // Admin controls
    pub fn set_collateral_factor(env: Env, admin: Address, asset: Address, factor: i128) {
        Self::require_admin(&env, &admin);
        let mut map = env
            .storage()
            .persistent()
            .get(&COLLATERAL_FACTORS)
            .unwrap_or(Map::new(&env));
        map.set(asset, factor);
        env.storage().persistent().set(&COLLATERAL_FACTORS, &map);
    }

    pub fn set_ltv(env: Env, admin: Address, asset: Address, ltv: i128) {
        Self::require_admin(&env, &admin);
        let mut map = env
            .storage()
            .persistent()
            .get(&LTV_RATIOS)
            .unwrap_or(Map::new(&env));
        map.set(asset, ltv);
        env.storage().persistent().set(&LTV_RATIOS, &map);
    }

    pub fn set_liquidation_threshold(env: Env, admin: Address, asset: Address, threshold: i128) {
        Self::require_admin(&env, &admin);
        let mut map = env
            .storage()
            .persistent()
            .get(&LIQ_THRESHOLDS)
            .unwrap_or(Map::new(&env));
        map.set(asset, threshold);
        env.storage().persistent().set(&LIQ_THRESHOLDS, &map);
    }

    pub fn set_liquidation_bonus(env: Env, admin: Address, asset: Address, bonus: i128) {
        Self::require_admin(&env, &admin);
        let mut map = env
            .storage()
            .persistent()
            .get(&LIQ_BONUSES)
            .unwrap_or(Map::new(&env));
        map.set(asset, bonus);
        env.storage().persistent().set(&LIQ_BONUSES, &map);
    }

    pub fn set_interest_rate_model(env: Env, admin: Address, asset: Address, model: Symbol) {
        Self::require_admin(&env, &admin);
        let mut map = env
            .storage()
            .persistent()
            .get(&INTEREST_MODELS)
            .unwrap_or(Map::new(&env));
        map.set(asset, model);
        env.storage().persistent().set(&INTEREST_MODELS, &map);
    }

    pub fn set_reserve_factor(env: Env, admin: Address, asset: Address, reserve: i128) {
        Self::require_admin(&env, &admin);
        let mut map = env
            .storage()
            .persistent()
            .get(&RESERVE_FACTORS)
            .unwrap_or(Map::new(&env));
        map.set(asset, reserve);
        env.storage().persistent().set(&RESERVE_FACTORS, &map);
    }

    pub fn set_treasury_address(env: Env, admin: Address, treasury: Address) {
        Self::require_admin(&env, &admin);
        env.storage().persistent().set(&TREASURY_ADDR, &treasury);
    }



    pub fn remove_supported_asset(env: Env, admin: Address, asset: Address) {
        Self::require_admin(&env, &admin);
        let list: Vec<Address> = env
            .storage()
            .persistent()
            .get(&SUPPORTED_ASSETS)
            .unwrap_or(Vec::new(&env));

        let mut updated = Vec::new(&env);
        for addr in list.iter() {
            if addr != asset {
                updated.push_back(addr);
            }
        }

        env.storage().persistent().set(&SUPPORTED_ASSETS, &updated);
    }

    pub fn pause_contract(env: Env, admin: Address) {
        Self::require_admin(&env, &admin);
        env.storage()
            .persistent()
            .set::<Symbol, bool>(&CONTRACT_PAUSED, &true);
    }

    pub fn unpause_contract(env: Env, admin: Address) {
        Self::require_admin(&env, &admin);
        env.storage()
            .persistent()
            .set::<Symbol, bool>(&CONTRACT_PAUSED, &false);
    }

    // when someone add deposit, depositCollatel, withdraw, withdrawCollateral just increase a counter that maintains
    // total collateral and debt

    // pub fn is_liquidatable(env: Env, user: Address) -> bool {
    //     // Example logic placeholder: Replace with actual collateral/debt ratio checks
    //     let collateral: i128 = Self::get_total_collateral(&env, &user);
    //     let debt: i128 = Self::get_total_debt(&env, &user);
    //     collateral * 100 < debt * 75 // e.g., below 75% collateralization
    // }

    // pub fn get_available_collateral(env: Env, user: Address) -> i128 {
    //     // Example logic placeholder: Replace with actual logic to determine available collateral
    //     let collateral: i128 = Self::get_total_collateral(&env, &user);
    //     let debt: i128 = Self::get_total_debt(&env, &user);
    //     let min_required = debt * 75 / 100; // Assuming 75% minimum ratio
    //     if collateral > min_required {
    //         collateral - min_required
    //     } else {
    //         0
    //     }
    // }

    pub fn get_supply_balance(env: Env, user: Address, asset: Address) -> i128 {
        let deposits = Self::get_user_deposits(&env);
        deposits.get((user, asset)).unwrap_or(0)
    }

    pub fn get_borrow_balance(env: Env, user: Address, asset: Address) -> i128 {
        let borrows = Self::get_user_borrows(&env);
        borrows.get((user, asset)).unwrap_or(0)
    }

    pub fn get_collateral_balance(env: Env, user: Address, asset: Address) -> i128 {
        // In current implementation, collateral is equivalent to deposits
        let deposits = Self::get_user_deposits(&env);
        deposits.get((user, asset)).unwrap_or(0)
    }

    pub fn get_utilization_rate(env: Env, asset: Address) -> i128 {
        let total_supplied = Self::get_total_deposits(&env)
            .get(asset.clone())
            .unwrap_or(0);
        let borrows = Self::get_user_borrows(&env);
        let supported: Vec<Address> = env
            .storage()
            .persistent()
            .get(&SUPPORTED_ASSETS)
            .unwrap_or(Vec::new(&env));

        if total_supplied == 0 {
            return 0;
        }

        let mut total_borrowed = 0;
        for (key, value) in borrows.iter() {
            let (_user, tok) = key;
            if tok == asset {
                total_borrowed += value;
            }
        }

        total_borrowed * 100 / total_supplied
    }

    pub fn get_available_to_borrow(env: Env, user: Address) -> i128 {
        let collateral_value = Self::get_user_collateral_value(env.clone(), user.clone());
        let debt = Self::get_user_debt_value(env, user);
        if collateral_value <= debt {
            0
        } else {
            collateral_value - debt
        }
    }

    pub fn get_interest_rate(env: Env, asset: Address) -> (i128, i128) {
        // Dummy implementation; in production, this should depend on utilization rate and interest rate model
        let total_supplied = Self::get_total_deposits(&env)
            .get(asset.clone())
            .unwrap_or(0);
        let borrows = Self::get_user_borrows(&env);
        let mut total_borrowed = 0;
        for (key, value) in borrows.iter() {
            let (_user, tok) = key;
            if tok == asset {
                total_borrowed += value;
            }
        }

        let utilization = if total_supplied == 0 {
            0
        } else {
            total_borrowed * 100 / total_supplied
        };

        // Assume: borrow_rate = utilization%, supply_rate = utilization * 0.8
        let borrow_rate = utilization;
        let supply_rate = utilization * 8 / 10;
        (supply_rate, borrow_rate)
    }

    pub fn get_pool_info(env: Env, asset: Address) -> (i128, i128, i128) {
        let total_supply = Self::get_total_deposits(&env)
            .get(asset.clone())
            .unwrap_or(0);
        let borrows = Self::get_user_borrows(&env);
        let mut total_borrowed = 0;
        for (key, value) in borrows.iter() {
            let (_user, tok) = key;
            if tok == asset {
                total_borrowed += value;
            }
        }

        let reserves: Map<Address, i128> = env
            .storage()
            .persistent()
            .get(&RESERVE_FACTORS)
            .unwrap_or(Map::new(&env));
        let reserve_factor = reserves.get(asset.clone()).unwrap_or(0);
        let reserve_amount = total_borrowed * reserve_factor / 100;

        (total_supply, total_borrowed, reserve_amount)
    }

    pub fn get_user_position(env: Env, user: Address) -> (i128, i128, i128, i128) {
        let supply = {
            let deposits = Self::get_user_deposits(&env);
            let supported: Vec<Address> = env
                .storage()
                .persistent()
                .get(&SUPPORTED_ASSETS)
                .unwrap_or(Vec::new(&env));
            let mut total = 0;
            for asset in supported.iter() {
                let amount = deposits.get((user.clone(), asset)).unwrap_or(0);
                total += amount;
            }
            total
        };

        let borrow = Self::get_user_debt_value(env.clone(), user.clone());
        let collateral = Self::get_user_collateral_value(env.clone(), user.clone());
        let health = Self::get_health_factor(env, user);

        (supply, borrow, collateral, health)
    }
}




    // pub fn add_supported_user(env: Env, admin: Address, user: Address) {
    //     Self::require_admin(&env, &admin);
    //     let mut list = env
    //         .storage()
    //         .persistent()
    //         .get(&SUPPORTED_USERS)
    //         .unwrap_or(Vec::new(&env));
    //     if !list.contains(&user) {
    //         list.push_back(user);
    //     }
    //     env.storage().persistent().set(&SUPPORTED_USERS, &list);
    // }

    // pub fn get_supported_users(env: Env) -> Vec<Address> {
    //     env.storage()
    //         .persistent()
    //         .get(&SUPPORTED_USERS)
    //         .unwrap_or(Vec::new(&env))
    // }

     fn require_admin(env: &Env, caller: &Address) {
        let treasury: Address = env
            .storage()
            .persistent()
            .get(&TREASURY_ADDR)
            .expect("Treasury not set");
        assert!(caller == &treasury, "Not authorized");
    }

```

#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Map, Symbol};

#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub struct DepositEvent {
    pub user: Address,
    pub amount: i128,
    pub old_total_deposits: i128,
    pub new_total_deposits: i128,
    pub old_user_deposit: i128,
    pub new_user_deposit: i128,
}

#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub struct WithdrawalEvent {
    pub user: Address,
    pub amount: i128,
    pub old_total_deposits: i128,
    pub new_total_deposits: i128,
    pub old_user_deposit: i128,
    pub new_user_deposit: i128,
}

#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub struct BorrowEvent {
    pub user: Address,
    pub amount: i128,
    pub old_user_borrow: i128,
    pub new_user_borrow: i128,
    pub max_borrow_limit: i128,
}

#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub struct RepaymentEvent {
    pub user: Address,
    pub amount: i128,
    pub actual_repay_amount: i128, 
    pub old_user_borrow: i128,
    pub new_user_borrow: i128,
}

#[contract]
pub struct LendingContract;

const USER_DEPOSITS: Symbol = symbol_short!("udeposits");
const USER_BORROWS: Symbol = symbol_short!("uborrows");
const TOTAL_DEPOSITS: Symbol = symbol_short!("tdeposits");
const TREASURY_ADDR: Symbol = symbol_short!("treasury");

#[contractimpl]
impl LendingContract {
    fn get_user_deposits(env: &Env) -> Map<Address, i128> {
        env.storage()
            .persistent()
            .get(&USER_DEPOSITS)
            .unwrap_or(Map::new(env))
    }

    fn get_user_borrows(env: &Env) -> Map<Address, i128> {
        env.storage()
            .persistent()
            .get(&USER_BORROWS)
            .unwrap_or(Map::new(env))
    }

    fn get_total_deposits(env: &Env) -> i128 {
        env.storage().persistent().get(&TOTAL_DEPOSITS).unwrap_or(0)
    }

    fn save_user_deposits(env: &Env, data: Map<Address, i128>) {
        env.storage().persistent().set(&USER_DEPOSITS, &data);
    }

    fn save_user_borrows(env: &Env, data: Map<Address, i128>) {
        env.storage().persistent().set(&USER_BORROWS, &data);
    }

    fn save_total_deposits(env: &Env, total: i128) {
        env.storage().persistent().set(&TOTAL_DEPOSITS, &total);
    }

    pub fn record_deposit(env: Env, user: Address, amount: i128) {
        assert!(amount > 0, "Amount must be > 0");

        user.require_auth();

        let mut user_deposits = Self::get_user_deposits(&env);
        let total_deposits = Self::get_total_deposits(&env);

        // Save the old values before updating
        let old_user_deposit = user_deposits.get(user.clone()).unwrap_or(0);
        let old_total_deposits = total_deposits;

        let new_user_deposit = old_user_deposit + amount;
        let new_total_deposits = old_total_deposits + amount;

        user_deposits.set(user.clone(), new_user_deposit);

        Self::save_user_deposits(&env, user_deposits.clone());
        Self::save_total_deposits(&env, new_total_deposits);

        // Publish a clean event
        env.events().publish(
            (symbol_short!("deposited"), user.clone()),
            DepositEvent {
                user: user.clone(),
                amount,
                old_total_deposits,
                new_total_deposits,
                old_user_deposit,
                new_user_deposit,
            },
        );
    }

    pub fn record_withdrawal(env: Env, user: Address, amount: i128) {
        assert!(amount > 0, "Amount must be > 0");

        // Verify user authentication
        user.require_auth();

        let mut user_deposits = Self::get_user_deposits(&env);
        let total_deposits = Self::get_total_deposits(&env);

        // Save the old values before updating
        let old_user_deposit = user_deposits.get(user.clone()).unwrap_or(0);
        let old_total_deposits = total_deposits;

        assert!(old_user_deposit >= amount, "Insufficient balance");

        let new_user_deposit = old_user_deposit - amount;
        let new_total_deposits = old_total_deposits - amount;

        user_deposits.set(user.clone(), new_user_deposit);

        Self::save_user_deposits(&env, user_deposits.clone());
        Self::save_total_deposits(&env, new_total_deposits);

        // Publish withdrawal event
        env.events().publish(
            (symbol_short!("withdrawn"), user.clone()),
            WithdrawalEvent {
                user: user.clone(),
                amount,
                old_total_deposits,
                new_total_deposits,
                old_user_deposit,
                new_user_deposit,
            },
        );
    }

    pub fn record_borrow(env: Env, user: Address, amount: i128) {
        assert!(amount > 0, "Amount must be > 0");

        // Verify user authentication
        user.require_auth();

        let user_deposits = Self::get_user_deposits(&env);
        let mut user_borrows = Self::get_user_borrows(&env);

        let deposited = user_deposits.get(user.clone()).unwrap_or(0);
        
        // Save the old values before updating
        let old_user_borrow = user_borrows.get(user.clone()).unwrap_or(0);

        let max_borrow = deposited * 70 / 100;
        assert!(old_user_borrow + amount <= max_borrow, "Exceeds max borrow limit");

        let new_user_borrow = old_user_borrow + amount;
        
        user_borrows.set(user.clone(), new_user_borrow);

        Self::save_user_borrows(&env, user_borrows.clone());

        // Publish borrow event
        env.events().publish(
            (symbol_short!("borrowed"), user.clone()),
            BorrowEvent {
                user: user.clone(),
                amount,
                old_user_borrow,
                new_user_borrow,
                max_borrow_limit: max_borrow,
            },
        );
    }

    pub fn record_repayment(env: Env, user: Address, amount: i128) {
        assert!(amount > 0, "Amount must be > 0");

        // Verify user authentication
        user.require_auth();

        let mut user_borrows = Self::get_user_borrows(&env);

        // Save the old values before updating
        let old_user_borrow = user_borrows.get(user.clone()).unwrap_or(0);
        
        assert!(old_user_borrow > 0, "Nothing to repay");

        let actual_repay_amount = if amount > old_user_borrow { old_user_borrow } else { amount };
        let new_user_borrow = old_user_borrow - actual_repay_amount;

        user_borrows.set(user.clone(), new_user_borrow);

        Self::save_user_borrows(&env, user_borrows.clone());

        // Publish repayment event
        env.events().publish(
            (symbol_short!("repaid"), user.clone()),
            RepaymentEvent {
                user: user.clone(),
                amount,
                actual_repay_amount,
                old_user_borrow,
                new_user_borrow,
            },
        );
    }

    pub fn get_user_balances(env: Env, user: Address) -> (i128, i128) {
        let user_deposits = Self::get_user_deposits(&env);
        let user_borrows = Self::get_user_borrows(&env);
        let deposit = user_deposits.get(user.clone()).unwrap_or(0);
        let borrow = user_borrows.get(user).unwrap_or(0);
        (deposit, borrow)
    }

    pub fn get_total_in_system(env: Env) -> i128 {
        Self::get_total_deposits(&env)
    }

    pub fn set_treasury(env: Env, admin: Address) {
        // Only allow setting treasury if it hasn't been set yet
        let treasury_exists = env.storage().persistent().has(&TREASURY_ADDR);
        assert!(!treasury_exists, "Treasury already set");

        env.storage().persistent().set(&TREASURY_ADDR, &admin);
    }
}
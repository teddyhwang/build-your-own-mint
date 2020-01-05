const moment = require('moment')
const client = require('./plaidClient')

// start from beginning of last month...
const startDate = moment()
  .subtract(1, 'month')
  .startOf('month')
  .format('YYYY-MM-DD');
// ends now.
// this ensures we always fully update last month,
// and keep current month up-to-date
const endDate = moment().format('YYYY-MM-DD')

const transactionFetchOptions = [
  startDate,
  endDate,
  {
    count: 250,
    offset: 0
  }
]

const plaidAccountTokens = Object.keys(process.env)
  .filter(key => key.startsWith(`PLAID_TOKEN`))
  .map(key => ({
    bank: key.replace(/^PLAID_TOKEN_(.*?)_/, ''),
    token: process.env[key]
  }))

exports.fetchTransactions = async function() {
  const accountsByBank = {};
  const rawAccounts = await Promise.all(plaidAccountTokens.map(({ bank, token }) => {
    return client.getAccounts(token)
      .then(({ accounts }) => {
        accountsByBank[bank] = accounts
        return accountsByBank
      })
  }))
  const rawTransactions = await Promise.all(plaidAccountTokens.map(({ bank, token }) => {
    return client.getTransactions(token, ...transactionFetchOptions)
      .then(({ transactions }) => ({
        bank,
        transactions
      }))
  }))

  // concat all transactions
  return rawTransactions.reduce((all, { bank, transactions }) => {
    return all.concat(transactions.map(({ name, date, amount, category, account_id }) => ({
      bank,
      account: accountsByBank[bank].find(account => account.account_id == account_id).official_name,
      date,
      name,
      amount: `$${-amount}`,
      category: category.join(', '),
    })))
  }, []).sort((a, b) => a.date > b.date ? -1 : 1)
}

exports.fetchBalances = async function() {
  const rawBalances = await Promise.all(plaidAccountTokens.map(({ bank, token }) => {
    return client.getBalance(token)
  }))

  return rawBalances.reduce((all, { accounts }) => {
    return all.concat(accounts.map(({ official_name, balances }) => ({
      official_name,
      balance: balances.current
    })))
  }, [])
}

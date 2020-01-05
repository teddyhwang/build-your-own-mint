const path = require('path')
let envPath = path.resolve(process.cwd(), '.env')
if (process.env['DOT_ENV_PATH']) {
  // For cron jobs
  envPath = path.resolve(process.env['DOT_ENV_PATH'], '.env');
}
require('dotenv').config({ path: envPath })

const { fetchTransactions, fetchBalances} = require('./lib/fetch')
const { transformTransactionsToUpdates } = require('./lib/transform')
const { updateSheet } = require('./lib/update')

;(async () => {
  const transactions = await fetchTransactions()
  const balances = await fetchBalances()
  console.log(balances)
  const updates = transformTransactionsToUpdates(transactions)
  updateSheet(updates)
})()

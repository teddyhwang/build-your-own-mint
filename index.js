const path = require('path')
envPath = path.resolve(process.cwd(), '.env')
if (process.env['DOT_ENV_PATH']) {
  // For cron jobs
  envPath = path.resolve(process.env['DOT_ENV_PATH'], '.env');
}
require('dotenv').config({ path: envPath })

const { fetchTransactions } = require('./lib/fetch')
const { transformTransactionsToUpdates } = require('./lib/transform')
const { updateSheet } = require('./lib/update')

;(async () => {
  const transactions = await fetchTransactions()
  console.log(transactions)
  const updates = transformTransactionsToUpdates(transactions)
  updateSheet(updates)
})()

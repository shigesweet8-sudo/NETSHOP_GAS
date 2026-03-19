1. Add the function getDashboardSummary(filter) in 20_api_netshop.gs.
2. Call listItems(filter) within getDashboardSummary to retrieve the data.
3. Calculate totalCount, totalSales, totalFee, totalShipping, totalCost, and totalProfit based on the retrieved data.
4. Compute profitRate using the formula (totalProfit / totalSales * 100), ensuring to handle division by zero.
5. Ensure that the function returns all values as numerical types and handles empty data gracefully.

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
const PAYOUT_PER_AD_VIEW = parseFloat(process.env.PAYOUT_PER_AD_VIEW) || 0.01;
const AD_VIEW_SECONDS = parseInt(process.env.AD_VIEW_SECONDS) || 5;
const MAX_ADS_PER_LINK = parseInt(process.env.MAX_ADS_PER_LINK) || 5;

// Start server
app.listen(PORT, () => {
  console.log(`LootLinks server running on http://localhost:${PORT}`);
  console.log(`Configuration:`);
  console.log(`  - Payout per ad view: $${PAYOUT_PER_AD_VIEW}`);
  console.log(`  - Ad view duration: ${AD_VIEW_SECONDS} seconds`);
  console.log(`  - Max ads per link: ${MAX_ADS_PER_LINK}`);
});

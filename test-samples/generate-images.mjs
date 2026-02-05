import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createImage(filename, svgContent) {
  const svgBuffer = Buffer.from(svgContent);
  await sharp(svgBuffer).png().toFile(path.join(__dirname, filename));
  console.log(`Created: ${filename}`);
}

// 1. Phishing Email Screenshot
const phishingEmail = `
<svg width="600" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="500" fill="#f5f5f5"/>
  <!-- Email header -->
  <rect x="20" y="20" width="560" height="460" rx="8" fill="white" stroke="#ddd"/>
  <rect x="20" y="20" width="560" height="50" rx="8" fill="#1a73e8"/>
  <rect x="20" y="62" width="560" height="8" fill="#1a73e8"/>
  <text x="40" y="52" font-family="Arial" font-size="16" fill="white" font-weight="bold">Inbox - security@paypal-alerts.com</text>

  <!-- From/To -->
  <text x="40" y="95" font-family="Arial" font-size="12" fill="#666">From: security@paypal-alerts.com</text>
  <text x="40" y="115" font-family="Arial" font-size="12" fill="#666">To: you@email.com</text>
  <text x="40" y="135" font-family="Arial" font-size="12" fill="#666">Subject: Your PayPal account has been limited</text>
  <line x1="40" y1="145" x2="560" y2="145" stroke="#eee" stroke-width="1"/>

  <!-- Body -->
  <text x="40" y="175" font-family="Arial" font-size="14" fill="#333" font-weight="bold">Dear Valued Customer,</text>
  <text x="40" y="205" font-family="Arial" font-size="13" fill="#333">We have noticed suspicious activity on your PayPal</text>
  <text x="40" y="225" font-family="Arial" font-size="13" fill="#333">account. Your account access has been limited until</text>
  <text x="40" y="245" font-family="Arial" font-size="13" fill="#333">you verify your information.</text>

  <text x="40" y="280" font-family="Arial" font-size="13" fill="#333">Please click the button below to restore your</text>
  <text x="40" y="300" font-family="Arial" font-size="13" fill="#333">account access within 24 hours or your account</text>
  <text x="40" y="320" font-family="Arial" font-size="13" fill="#cc0000" font-weight="bold">will be permanently closed.</text>

  <!-- Fake button -->
  <rect x="40" y="345" width="200" height="40" rx="4" fill="#0070ba"/>
  <text x="85" y="371" font-family="Arial" font-size="14" fill="white" font-weight="bold">Verify Account Now</text>

  <!-- Suspicious link -->
  <text x="40" y="410" font-family="Arial" font-size="10" fill="#999">Link: http://paypa1-secure-verify.tk/restore?token=x8832</text>

  <!-- Footer -->
  <text x="40" y="445" font-family="Arial" font-size="11" fill="#666">PayPal Security Team</text>
  <text x="40" y="465" font-family="Arial" font-size="10" fill="#999">© 2024 PayPal Inc. All rights reserved.</text>
</svg>`;

// 2. Tech Support Popup
const techSupport = `
<svg width="600" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="450" fill="#001f8a"/>

  <!-- Warning icons -->
  <text x="260" y="60" font-family="Arial" font-size="40" fill="#ffcc00">⚠️</text>

  <!-- Main warning -->
  <text x="300" y="110" font-family="Arial" font-size="22" fill="white" font-weight="bold" text-anchor="middle">Windows Defender - Security Warning</text>

  <rect x="50" y="130" width="500" height="250" rx="4" fill="#002b9e" stroke="#4488ff"/>

  <text x="300" y="165" font-family="Arial" font-size="14" fill="#ff4444" font-weight="bold" text-anchor="middle">** YOUR COMPUTER HAS BEEN BLOCKED **</text>

  <text x="70" y="195" font-family="Arial" font-size="12" fill="white">Error # DW6VB36</text>

  <text x="70" y="220" font-family="Arial" font-size="12" fill="white">Trojan Spyware Alert - Error Code: #0x898778</text>
  <text x="70" y="240" font-family="Arial" font-size="12" fill="white">Access to this PC has been blocked for security reasons.</text>
  <text x="70" y="260" font-family="Arial" font-size="12" fill="white">Your personal data and banking information is at risk.</text>
  <text x="70" y="280" font-family="Arial" font-size="12" fill="white">Contact Windows Support immediately:</text>

  <text x="300" y="315" font-family="Arial" font-size="24" fill="#ffcc00" font-weight="bold" text-anchor="middle">1-888-555-0147</text>

  <text x="300" y="345" font-family="Arial" font-size="11" fill="#aaa" text-anchor="middle">Do NOT shut down or restart your computer.</text>
  <text x="300" y="365" font-family="Arial" font-size="11" fill="#aaa" text-anchor="middle">Doing so may result in permanent data loss.</text>

  <!-- Fake button -->
  <rect x="200" y="395" width="200" height="35" rx="4" fill="#cc0000"/>
  <text x="300" y="418" font-family="Arial" font-size="13" fill="white" font-weight="bold" text-anchor="middle">Call Support Now</text>
</svg>`;

// 3. SMS Phishing Screenshot
const smsPhishing = `
<svg width="375" height="667" xmlns="http://www.w3.org/2000/svg">
  <!-- Phone frame -->
  <rect width="375" height="667" fill="#f2f2f7"/>

  <!-- Status bar -->
  <rect x="0" y="0" width="375" height="44" fill="#f2f2f7"/>
  <text x="175" y="30" font-family="Arial" font-size="14" fill="#333" text-anchor="middle" font-weight="bold">9:41</text>

  <!-- Header -->
  <rect x="0" y="44" width="375" height="50" fill="white"/>
  <text x="187" y="75" font-family="Arial" font-size="16" fill="#333" text-anchor="middle" font-weight="bold">+1 (833) 555-0198</text>
  <line x1="0" y1="94" x2="375" y2="94" stroke="#ddd"/>

  <!-- Messages -->
  <!-- Scam SMS 1 -->
  <rect x="20" y="120" width="280" height="90" rx="16" fill="#e5e5ea"/>
  <text x="35" y="145" font-family="Arial" font-size="14" fill="#333">USPS: Your package has a delivery</text>
  <text x="35" y="165" font-family="Arial" font-size="14" fill="#333">issue. Update your address to</text>
  <text x="35" y="185" font-family="Arial" font-size="14" fill="#333">ensure delivery:</text>
  <text x="35" y="205" font-family="Arial" font-size="13" fill="#0066cc">http://usps-redelivery.xyz/track</text>
  <text x="265" y="225" font-family="Arial" font-size="10" fill="#999">10:23 AM</text>

  <!-- Scam SMS 2 -->
  <rect x="20" y="250" width="290" height="110" rx="16" fill="#e5e5ea"/>
  <text x="35" y="275" font-family="Arial" font-size="14" fill="#333">ALERT: Your Bank of America</text>
  <text x="35" y="295" font-family="Arial" font-size="14" fill="#333">account has been locked. Verify</text>
  <text x="35" y="315" font-family="Arial" font-size="14" fill="#333">your identity now to restore</text>
  <text x="35" y="335" font-family="Arial" font-size="14" fill="#333">access:</text>
  <text x="35" y="355" font-family="Arial" font-size="13" fill="#0066cc">http://boa-secure.tk/verify</text>
  <text x="275" y="375" font-family="Arial" font-size="10" fill="#999">11:05 AM</text>

  <!-- Scam SMS 3 -->
  <rect x="20" y="400" width="280" height="80" rx="16" fill="#e5e5ea"/>
  <text x="35" y="425" font-family="Arial" font-size="14" fill="#333">IRS Notice: You owe $3,247 in</text>
  <text x="35" y="445" font-family="Arial" font-size="14" fill="#333">unpaid taxes. Pay now to avoid</text>
  <text x="35" y="465" font-family="Arial" font-size="14" fill="#333">arrest: http://irs-pay.net/due</text>
  <text x="265" y="485" font-family="Arial" font-size="10" fill="#999">2:17 PM</text>

  <!-- Input area -->
  <rect x="0" y="617" width="375" height="50" fill="white"/>
  <rect x="15" y="627" width="295" height="30" rx="15" fill="#f2f2f7" stroke="#ddd"/>
  <text x="30" y="647" font-family="Arial" font-size="14" fill="#999">Text Message</text>
</svg>`;

// 4. Crypto Investment Scam (fake social media)
const cryptoScam = `
<svg width="600" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="500" fill="white"/>

  <!-- Social media post frame -->
  <rect x="20" y="20" width="560" height="460" rx="8" fill="white" stroke="#ddd"/>

  <!-- Profile header -->
  <circle cx="60" cy="60" r="22" fill="#4ecdc4"/>
  <text x="55" y="65" font-family="Arial" font-size="16" fill="white" text-anchor="middle">CT</text>
  <text x="92" y="52" font-family="Arial" font-size="14" fill="#333" font-weight="bold">CryptoTrader_Elite</text>
  <text x="92" y="70" font-family="Arial" font-size="11" fill="#0066cc">Sponsored · 🔵</text>

  <!-- Post content -->
  <text x="40" y="110" font-family="Arial" font-size="14" fill="#333">🚀 I turned $500 into $47,000 in just ONE WEEK</text>
  <text x="40" y="132" font-family="Arial" font-size="14" fill="#333">using this AI crypto trading platform! 📈💰</text>
  <text x="40" y="160" font-family="Arial" font-size="14" fill="#333">✅ Guaranteed 300% returns</text>
  <text x="40" y="182" font-family="Arial" font-size="14" fill="#333">✅ Automated AI trading bot</text>
  <text x="40" y="204" font-family="Arial" font-size="14" fill="#333">✅ Withdraw anytime</text>
  <text x="40" y="226" font-family="Arial" font-size="14" fill="#333">✅ Only 50 spots remaining!</text>

  <!-- Fake screenshot of gains -->
  <rect x="40" y="245" width="520" height="100" rx="8" fill="#0d1117"/>
  <text x="60" y="275" font-family="monospace" font-size="13" fill="#4ecdc4">Portfolio Value: $47,283.52</text>
  <text x="60" y="300" font-family="monospace" font-size="13" fill="#00ff00">+9,356.71% (7d)</text>
  <text x="60" y="325" font-family="monospace" font-size="11" fill="#888">BTC: +4,200% | ETH: +3,800% | SOL: +12,000%</text>

  <!-- CTA -->
  <text x="40" y="375" font-family="Arial" font-size="14" fill="#333">⬇️ Start earning NOW - Link in bio ⬇️</text>
  <text x="40" y="397" font-family="Arial" font-size="13" fill="#0066cc">https://cryptoelite-ai.io/join?ref=EARNNOW</text>

  <!-- Engagement -->
  <line x1="20" y1="420" x2="580" y2="420" stroke="#eee"/>
  <text x="40" y="445" font-family="Arial" font-size="12" fill="#666">❤️ 2,847   💬 394   ↗️ 1,203</text>
  <text x="40" y="468" font-family="Arial" font-size="11" fill="#999">View all 394 comments</text>
</svg>`;

// 5. Gift Card Scam Email
const giftCardScam = `
<svg width="600" height="480" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="480" fill="#f5f5f5"/>
  <rect x="20" y="20" width="560" height="440" rx="8" fill="white" stroke="#ddd"/>

  <!-- Email header -->
  <rect x="20" y="20" width="560" height="50" rx="8" fill="#333"/>
  <rect x="20" y="62" width="560" height="8" fill="#333"/>
  <text x="40" y="52" font-family="Arial" font-size="14" fill="white" font-weight="bold">From: CEO John Smith (ceo.johnsmith@gmail.com)</text>

  <text x="40" y="95" font-family="Arial" font-size="12" fill="#666">To: you@company.com</text>
  <text x="40" y="115" font-family="Arial" font-size="12" fill="#666">Subject: URGENT - Need your help with something</text>
  <text x="440" y="115" font-family="Arial" font-size="11" fill="#cc0000" font-weight="bold">! URGENT</text>
  <line x1="40" y1="130" x2="560" y2="130" stroke="#eee"/>

  <!-- Body -->
  <text x="40" y="160" font-family="Arial" font-size="13" fill="#333">Hi,</text>
  <text x="40" y="185" font-family="Arial" font-size="13" fill="#333">Are you available? I need you to handle something</text>
  <text x="40" y="205" font-family="Arial" font-size="13" fill="#333">for me right away. I'm in a meeting and can't talk</text>
  <text x="40" y="225" font-family="Arial" font-size="13" fill="#333">on the phone.</text>

  <text x="40" y="255" font-family="Arial" font-size="13" fill="#333">I need you to purchase 5 Apple gift cards, $200</text>
  <text x="40" y="275" font-family="Arial" font-size="13" fill="#333">each ($1,000 total). They're for our top clients as</text>
  <text x="40" y="295" font-family="Arial" font-size="13" fill="#333">a surprise appreciation gift.</text>

  <text x="40" y="325" font-family="Arial" font-size="13" fill="#333" font-weight="bold">Please purchase them ASAP and send me photos</text>
  <text x="40" y="345" font-family="Arial" font-size="13" fill="#333" font-weight="bold">of the back of each card with the codes.</text>

  <text x="40" y="375" font-family="Arial" font-size="13" fill="#333">I'll reimburse you by end of day. Keep this between</text>
  <text x="40" y="395" font-family="Arial" font-size="13" fill="#333">us for now - it's a surprise.</text>

  <text x="40" y="425" font-family="Arial" font-size="13" fill="#333">Thanks,</text>
  <text x="40" y="445" font-family="Arial" font-size="13" fill="#333" font-weight="bold">John Smith, CEO</text>
  <text x="40" y="462" font-family="Arial" font-size="11" fill="#999">Sent from my iPhone</text>
</svg>`;

async function main() {
  console.log("Generating scam test images...\n");

  await createImage("phishing-email.png", phishingEmail);
  await createImage("tech-support-popup.png", techSupport);
  await createImage("sms-phishing.png", smsPhishing);
  await createImage("crypto-investment-scam.png", cryptoScam);
  await createImage("gift-card-scam-email.png", giftCardScam);

  console.log("\nDone! All test images created in test-samples/");
}

main().catch(console.error);

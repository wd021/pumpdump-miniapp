import React from "react";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>Last updated: 16.12.2024</p>

      <section>
        <h2>1. Information We Collect</h2>
        <p>
          When you use our Telegram bot, we collect and process the following
          information:
          <ul>
            <li>Telegram User ID</li>
            <li>Username (if publicly available)</li>
            <li>Transaction history related to your betting activities</li>
            <li>Betting preferences and patterns</li>
          </ul>
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>
          We use the collected information for:
          <ul>
            <li>Processing and managing your bets</li>
            <li>Maintaining betting history</li>
            <li>Providing customer support</li>
            <li>Preventing fraud and ensuring fair play</li>
            <li>Improving our services</li>
          </ul>
        </p>
      </section>

      <section>
        <h2>3. Data Storage and Security</h2>
        <p>
          We implement appropriate security measures to protect your
          information. Your data is stored securely and is only accessible to
          authorized personnel.
        </p>
      </section>

      <section>
        <h2>4. Data Sharing</h2>
        <p>
          We do not sell, trade, or otherwise transfer your information to third
          parties. Your data may only be shared when required by law or with
          your explicit consent.
        </p>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>
          You have the right to:
          <ul>
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </p>
      </section>

      <section>
        <h2>6. Changes to Privacy Policy</h2>
        <p>
          We reserve the right to modify this privacy policy at any time.
          Changes will be effective immediately upon posting to our service.
        </p>
      </section>

      <section>
        <h2>7. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us
          through our Telegram bot support channel.
        </p>
      </section>

      <section>
        <h2>8. Legal Notice</h2>
        <p>
          By using our bot, you acknowledge that cryptocurrency betting involves
          significant risk. You are responsible for complying with your local
          laws and regulations regarding cryptocurrency trading and betting.
        </p>
      </section>
    </div>
  );
};

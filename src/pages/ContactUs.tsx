function ContactUs() {
  return (
    <section className="section-grid" aria-label="Contact us">
      <div className="card">
        <h1 className="page-title">Contact Us</h1>
        <p>Reach out with questions, bug reports, suggestions, or partnership ideas.</p>
      </div>

      <div className="contact-grid">
        <div className="card contact-card">
          <h2>Team Contact</h2>
          <ul className="contact-links">
            <li>Email: <a href="mailto:hello@slapstudy.com">hello@slapstudy.com</a></li>
            <li>Instagram: <a href="https://www.instagram.com/slapstudy">@slapstudy</a></li>
            <li>TikTok: <a href="https://www.tiktok.com/@slapstudy">@slapstudy</a></li>
            <li>YouTube: <a href="https://www.youtube.com/channel/slapstudy">slAP Study</a></li>
            <li>Discord: Coming soon</li>
            <li>Reddit: <a href="https://www.reddit.com/r/slAPStudy">/r/slAPStudy</a></li>
          </ul>
        </div>

        <div className="card contact-card">
          <h2>Feedback Form</h2>
          <div className="feedback-box">
            <label>
              Name
              <input type="text" placeholder="Your name" aria-label="Name" />
            </label>
            <label>
              Email
              <input type="email" placeholder="Your email" aria-label="Email" />
            </label>
            <label>
              Message
              <textarea placeholder="Your message" aria-label="Message" />
            </label>
            <button className="submit-button" type="button">Send Feedback</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactUs;

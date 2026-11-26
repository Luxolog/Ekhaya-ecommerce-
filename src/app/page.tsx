const plans = [
  {
    name: "Starter",
    price: "R50",
    description: "Get your business online.",
    features: ["1 online store", "Up to 10 products", "Basic store themes", "Order management", "Essential sales insights"],
    action: "Start with Starter",
  },
  {
    name: "Business",
    price: "R100",
    description: "Build a more recognisable brand.",
    features: ["1 online store", "Up to 50 products", "Connect your own domain", "1 professional email address", "Customer accounts and notifications"],
    action: "Choose Business",
    featured: true,
  },
  {
    name: "Growth",
    price: "R199",
    description: "More room to scale your business.",
    features: ["Up to 3 online stores", "Up to 500 products", "Connect your own domains", "1 professional email address", "Advanced notifications and marketing"],
    action: "Choose Growth",
  },
];

const capabilities = [
  ["01", "Your own storefront", "A branded online shop with products, collections and a smooth mobile shopping experience."],
  ["02", "Orders in one place", "Manage incoming orders, fulfilment status, customer details and sales activity."],
  ["03", "Your payment accounts", "Connect supported payment gateway accounts that belong to your business. Your payments go to you."],
  ["04", "Your domain, your brand", "On eligible plans, connect a domain you register and own. Domain registration remains in your name."],
  ["05", "Business notifications", "Keep customers informed about orders and important store activity through plan-based notification features."],
  ["06", "Built to grow", "Manage products, digital items, bookings and team access within your plan limits."],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Ekhaya Ecommerce home">
          <span className="brand-mark">E</span>
          <span>ekhaya<span className="brand-light"> ecommerce</span></span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a className="button button-dark header-cta" href="#pricing">Start your store <span>↗</span></a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> MADE FOR BUSINESSES READY TO GROW</div>
          <h1>Your business.<br /><em>Your store.</em><br />Your next chapter.</h1>
          <p className="hero-description">Everything you need to take your business online. Create your store, manage your sales and build a brand customers remember.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#pricing">Explore plans <span>→</span></a>
            <a className="text-link" href="#features">Discover the platform <span>↓</span></a>
          </div>
          <div className="hero-note"><span className="note-line" /> Simple monthly plans. No marketplace middleman.</div>
        </div>
        <div className="hero-visual" aria-label="Illustration of an online store dashboard">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="store-window">
            <div className="window-top"><div className="window-dots"><i /><i /><i /></div><span>YOUR BRAND STORE</span><span className="window-menu">•••</span></div>
            <div className="store-banner">
              <span className="store-kicker">THE EVERYDAY EDIT</span>
              <strong>Made for<br />your moment.</strong>
              <span className="store-shop">SHOP COLLECTION ↗</span>
            </div>
            <div className="store-products">
              <div className="product-tile product-one"><span>01 / NEW ARRIVAL</span><div className="product-shape shape-one" /><b>Everyday essentials</b><small>From R249</small></div>
              <div className="product-tile product-two"><span>02 / BEST SELLER</span><div className="product-shape shape-two" /><b>Made to be yours</b><small>From R399</small></div>
            </div>
          </div>
          <div className="floating-card sales-card"><span className="float-icon">↗</span><div><small>STORE ACTIVITY</small><strong>Your next sale starts here</strong></div></div>
          <div className="floating-card domain-card"><span className="domain-icon">⌘</span><div><small>YOUR OWN DOMAIN</small><strong>yourbrand.co.za</strong></div><span className="domain-check">✓</span></div>
          <div className="hero-stamp"><span>BUILT FOR</span><strong>LOCAL<br />BUSINESS</strong><span>MADE TO GROW</span></div>
        </div>
      </section>

      <section className="trust-strip"><span>ONE PLACE TO RUN YOUR ONLINE BUSINESS</span><div><b>STORE</b><i /> <b>SELL</b><i /> <b>MANAGE</b><i /> <b>GROW</b></div></section>

      <section className="section features-section" id="features">
        <div className="section-heading">
          <div><div className="eyebrow">THE TOOLS TO MOVE FORWARD</div><h2>More than a website.<br /><em>Your business home.</em></h2></div>
          <p>Start small, look professional and keep the important parts of your online business connected.</p>
        </div>
        <div className="feature-grid">
          {capabilities.map(([number, title, description]) => (
            <article className="feature-card" key={number}>
              <span className="feature-number">{number}</span><span className="feature-arrow">↗</span>
              <h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-intro"><div className="eyebrow">GET STARTED WITHOUT THE HEADACHE</div><h2>From idea to<br /><em>open for business.</em></h2><p>Set up your store at your own pace. You stay in control of your products, brand and customer relationships.</p></div>
        <div className="steps">
          <div className="step"><span>01</span><div><h3>Create your account</h3><p>Register your business and verify your email address.</p></div></div>
          <div className="step"><span>02</span><div><h3>Make it yours</h3><p>Add your store name, logo, products and preferred look.</p></div></div>
          <div className="step"><span>03</span><div><h3>Connect and publish</h3><p>Configure your payment account, choose a plan and launch when ready.</p></div></div>
        </div>
      </section>

      <section className="section pricing-section" id="pricing">
        <div className="pricing-heading"><div className="eyebrow">STRAIGHTFORWARD MONTHLY PRICING</div><h2>A plan for your <em>next step.</em></h2><p>Start with what you need. Upgrade when your business is ready.</p></div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card ${plan.featured ? "price-featured" : ""}`} key={plan.name}>
              {plan.featured && <div className="popular-label">MOST POPULAR</div>}
              <div className="plan-name">{plan.name}</div><p className="plan-description">{plan.description}</p>
              <div className="price">{plan.price}<span>/ month</span></div>
              <a className={`button ${plan.featured ? "button-primary" : "button-outline"}`} href="mailto:hello@ekhaya.co.za">{plan.action} <span>→</span></a>
              <div className="plan-divider" /><div className="includes-label">WHAT'S INCLUDED</div>
              <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
            </article>
          ))}
        </div>
        <p className="pricing-footnote">Custom domains require a domain registered by the merchant. Domain registration and external email-provider charges may be billed separately. Plan limits and included notification allowances are subject to the final service terms.</p>
      </section>

      <section className="closing-cta"><div><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>Let's get your business<br /><em>out into the world.</em></h2></div><a className="button button-light" href="#pricing">Find your plan <span>↗</span></a></section>

      <footer className="site-footer"><a className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></a><span>© {new Date().getFullYear()} Ekhaya Ecommerce. Built for local business.</span><a href="mailto:hello@ekhaya.co.za">Contact us ↗</a></footer>
    </main>
  );
}
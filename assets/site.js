(function () {
  const state = {
    publications: [],
    featuredSlugs: [],
    featuredDetails: {},
    news: [],
    filters: { query: "", year: "", venue: "", sortBy: "year-desc" }
  };

  const el = {
    newsList: document.getElementById("newsList"),
    foundationModels: document.getElementById("foundationModels"),
    postTraining: document.getElementById("postTraining"),
    multiModal: document.getElementById("multiModal"),
    visionEncoders: document.getElementById("visionEncoders"),
    otherPubs: document.getElementById("otherPubs"),
  };

  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function applyTheme(theme) {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }

  function initTheme() {
    const saved = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
    if (saved) return applyTheme(saved);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  function renderNews() {
    if (!el.newsList) return;
    el.newsList.innerHTML = state.news.map(item => {
      const formattedTitle = item.title.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `
        <li>
          <span class="date">${item.date}</span> ${formattedTitle}
          ${item.link ? ` <a target="_blank" rel="noreferrer" href="${item.link}">Link</a>` : ""}
        </li>
      `;
    }).join("");
  }

  function formatAuthors(authorsString) {
    if (!authorsString) return '';
    
    // Split by 'and' or comma and clean up
    const authors = authorsString
      .split(/\s+and\s+|,\s*/)
      .map(author => author.trim())
      .filter(author => author.length > 0);
    
    if (authors.length <= 8) {
      return authors.join(', ');
    } else {
      return authors.slice(0, 8).join(', ') + ', et al.';
    }
  }

  function renderPubCard(p, isHighlighted = false) {
    const links = [];
    if (p.links) {
      if (p.links.pdf) links.push(`<a target="_blank" rel="noreferrer" href="${p.links.pdf}">paper</a>`);
      if (p.links.code) links.push(`<a target="_blank" rel="noreferrer" href="${p.links.code}">code</a>`);
      if (p.links.project) links.push(`<a target="_blank" rel="noreferrer" href="${p.links.project}">project page</a>`);
      if (p.links.video) links.push(`<a target="_blank" rel="noreferrer" href="${p.links.video}">video</a>`);
      if (p.links.cite) links.push(`<a target="_blank" rel="noreferrer" href="${p.links.cite}">cite</a>`);
    }
    
    const details = state.featuredDetails[p.id] || {};
    const highlight = isHighlighted ? (details.highlight || "") : "";
    const image = isHighlighted ? (details.image || "") : "";
    const post = isHighlighted ? (details.post || "") : "";
    const paper = isHighlighted ? (details.paper || "") : "";
    const models = isHighlighted ? (details.models || "") : "";
    const dataset = isHighlighted ? (details.dataset || "") : "";
    const postLink = post ? `<a target="_blank" rel="noreferrer" href="${post}">post</a>` : "";
    const paperLink = paper ? `<a target="_blank" rel="noreferrer" href="${paper}">paper</a>` : "";
    const modelsLink = models ? `<a target="_blank" rel="noreferrer" href="${models}">models</a>` : "";
    const datasetLink = dataset ? `<a target="_blank" rel="noreferrer" href="${dataset}">HF dataset</a>` : "";
    
    // Get the first available link for click handling
    const primaryLink = (p.links && p.links.project) || paper || "";
    
    const imageBlock = image ? (primaryLink ? `<a href="${primaryLink}" target="_blank" rel="noreferrer" class="thumb-link"><img class="thumb" alt="${p.title}" src="${image}" /></a>` : `<img class="thumb" alt="${p.title}" src="${image}" />`) : "";
    const highlightBlock = highlight ? `<div class="highlight">${highlight}</div>` : "";
    const cardClass = isHighlighted ? 'highlighted' : 'minimal';
    const formattedAuthors = formatAuthors(p.authors);

    // Create venue info with cleaned formatting
    let venueInfo = '';
    if (p.venue) {
      let venue = p.venue;
      
      // Clean up arXiv preprint and e-prints format
      if (venue.includes('arXiv preprint') || venue.includes('arXiv e-prints')) {
        venue = `arXiv ${p.year || ''}`.trim();
      }
      // Clean up conference names that already include year
      else if (venue.match(/\b(ICLR|CVPR|NeurIPS|ICML|AAAI|IJCAI|ECCV|ICCV|WACV)\s*\d{4}\b/i)) {
        venue = venue; // Keep as is since it already has the year
      }
      // For other venues, add year if available and not already present
      else if (p.year && !venue.includes(p.year)) {
        venue = `${venue} ${p.year}`;
      }
      
      venueInfo = venue;
    } else if (p.year) {
      venueInfo = p.year;
    }

    if (isHighlighted) {
      const titleContent = primaryLink ? `<a href="${primaryLink}" target="_blank" rel="noreferrer" class="title-link">${p.title}</a>` : p.title;
      return `
        <article class="pub-card ${cardClass}" data-venue="${p.venue || ''}" data-year="${p.year || ''}">
          ${imageBlock}
          <div class="pub-content">
            <h3 class="title">${titleContent}</h3>
            ${highlightBlock}
            <div class="meta">${formattedAuthors}</div>
            <div class="venue-links">
              ${venueInfo ? `<span class="venue">${venueInfo}</span>` : ''}
              ${(links.length || postLink || paperLink || modelsLink || datasetLink) ? `<span class="links">${[...links, modelsLink, datasetLink, paperLink, postLink].filter(Boolean).join(' • ')}</span>` : ''}
            </div>
          </div>
        </article>
      `;
    } else {
      return `
        <article class="pub-card ${cardClass}" data-venue="${p.venue || ''}" data-year="${p.year || ''}">
          <div class="pub-content">
            <h3 class="title">${p.title}</h3>
            <div class="meta">${formattedAuthors}</div>
            <div class="venue-links">
              ${venueInfo ? `<span class="venue">${venueInfo}</span>` : ''}
              ${(links.length || postLink || paperLink || modelsLink || datasetLink) ? `<span class="links">${[...links, modelsLink, datasetLink, paperLink, postLink].filter(Boolean).join(' • ')}</span>` : ''}
            </div>
          </div>
        </article>
      `;
    }
  }

  function categorizePublications() {
    const categories = {
      foundationModels: [],
      postTraining: [],
      multiModal: [],
      visionEncoders: [],
      other: []
    };

    // Define paper IDs for each category
    const foundationModelIds = [
      'nemotron-h-a-family-of-accurate-and-efficient-hybrid-mamba-transformer-models',
      'hymba-a-hybrid-head-architecture-for-small-language-models',
      'small-language-models-are-the-future-of-agentic-ai',
      'climb-clustering-based-iterative-data-mixture-bootstrapping-for-language-model-pre-training'
    ];
    
    const postTrainingIds = [
      'dora-weight-decomposed-low-rank-adaptation',
      'llm-pruning-and-distillation-in-practice-the-minitron-approach',
      'efficient-hybrid-language-model-compression-through-group-aware-ssm-pruning',
      'puzzle-distillation-based-nas-for-inference-optimized-llms',
    ];
    
    const multiModalIds = [
      'nvila-efficient-frontier-visual-language-models', 
      'omnivinci-enhancing-architecture-and-data-for-omni-modal-understanding-llm',
      'scaling-vision-pre-training-to-4k-resolution'
    ];
    
    const visionEncoderIds = [
      'radiov2-5-improved-baselines-for-agglomerative-vision-foundation-models',
    ];

    state.publications.forEach(pub => {
      if (foundationModelIds.includes(pub.id)) {
        categories.foundationModels.push(pub);
      } else if (postTrainingIds.includes(pub.id)) {
        categories.postTraining.push(pub);
      } else if (multiModalIds.includes(pub.id)) {
        categories.multiModal.push(pub);
      } else if (visionEncoderIds.includes(pub.id)) {
        categories.visionEncoders.push(pub);
      } else {
        categories.other.push(pub);
      }
    });

    // Sort each category by year (newest first)
    Object.keys(categories).forEach(key => {
      categories[key].sort((a, b) => (b.year || 0) - (a.year || 0));
    });

    return categories;
  }

  function renderPublications() {
    const categories = categorizePublications();
    
    if (el.foundationModels) {
      el.foundationModels.innerHTML = categories.foundationModels.map(p => renderPubCard(p, true)).join("");
    }
    
    if (el.postTraining) {
      el.postTraining.innerHTML = categories.postTraining.map(p => renderPubCard(p, true)).join("");
    }
    
    if (el.multiModal) {
      el.multiModal.innerHTML = categories.multiModal.map(p => renderPubCard(p, true)).join("");
    }
    
    if (el.visionEncoders) {
      el.visionEncoders.innerHTML = categories.visionEncoders.map(p => renderPubCard(p, true)).join("");
    }
    
    if (el.otherPubs) {
      el.otherPubs.innerHTML = categories.other.map(p => renderPubCard(p, false)).join("");
    }
  }

  async function loadJSON(path, fallback) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      console.warn("Failed to load", path, e);
      return fallback;
    }
  }

  async function init() {
    const [news, publications, featured, featuredDetails] = await Promise.all([
      loadJSON("data/news.json", []),
      loadJSON("data/publications.json", []),
      loadJSON("data/featured.json", []),
      loadJSON("data/featured_details.json", {})
    ]);
    state.news = news;
    state.publications = publications;
    state.featuredSlugs = featured;
    state.featuredDetails = (Array.isArray(featuredDetails) ? {} : featuredDetails) || {};
    renderNews();
    renderPublications();
  }

  function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });

    // Update active nav link on scroll
    const sections = document.querySelectorAll('section, header');
    const navLinksArray = Array.from(navLinks);

    function updateActiveNavLink() {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
          current = section.getAttribute('id') || 'home';
        }
      });

      navLinksArray.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}` || 
            (current === 'home' && link.getAttribute('href') === '#home')) {
          link.classList.add('active');
        }
      });
    }

    // Smooth scrolling for anchor links
    navLinksArray.forEach(link => {
      if (link.getAttribute('href').startsWith('#')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          const targetSection = document.getElementById(targetId) || document.querySelector('header');
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    });

    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink(); // Initial call
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
      initNavigation();
    });
  } else { 
    init(); 
    initNavigation();
  }
})();



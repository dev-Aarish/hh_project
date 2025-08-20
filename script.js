// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initScrollAnimations();
    initNavigation();
    initCounters();
    initCarousel();
    initTimers();
    initSmoothScroll();
    initHeaderScroll();
    initMobileMenu();
    initThemeToggle();
});

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Add fade-in animation to sections
    const animateElements = document.querySelectorAll('.step-card, .counter-item, .listing-card, .hero-card, .impact-card');
    
    animateElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });

    // Add slide animations
    const leftSlideElements = document.querySelectorAll('.stat-column');
    leftSlideElements.forEach(el => {
        el.classList.add('slide-in-left');
        observer.observe(el);
    });

    const rightSlideElements = document.querySelectorAll('.testimonial-column');
    rightSlideElements.forEach(el => {
        el.classList.add('slide-in-right');
        observer.observe(el);
    });
}

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
        });
    });
}

// Animated Counters
function initCounters() {
    const counters = document.querySelectorAll('.counter-number');
    
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target.toLocaleString() + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Success Stories Carousel
function initCarousel() {
    const slides = document.querySelectorAll('.story-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentSlide = 0;

    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Show current slide
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    // Event listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Indicator clicks
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

    // Auto-play
    setInterval(nextSlide, 5000);
}

// Live Listing Timers
function initTimers() {
    const timers = document.querySelectorAll('.listing-timer');
    
    timers.forEach(timer => {
        const minutes = parseInt(timer.getAttribute('data-minutes'));
        startCountdown(timer, minutes);
    });
}

function startCountdown(element, totalMinutes) {
    let remainingSeconds = totalMinutes * 60;
    
    const interval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds <= 0) {
            element.textContent = 'Expired';
            element.style.color = '#e74c3c';
            clearInterval(interval);
            return;
        }
        
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        
        let timeString = '';
        if (hours > 0) {
            timeString = `Expires in ${hours}h ${minutes}m`;
        } else {
            timeString = `Expires in ${minutes}m ${seconds}s`;
        }
        
        element.textContent = timeString;
        
        // Color coding based on urgency
        if (remainingSeconds < 1800) { // Less than 30 minutes
            element.style.color = '#e74c3c';
        } else if (remainingSeconds < 3600) { // Less than 1 hour
            element.style.color = '#f39c12';
        } else {
            element.style.color = '#27ae60';
        }
    }, 1000);
}

// Smooth Scroll
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Scroll down arrow
    const scrollArrow = document.querySelector('.scroll-arrow');
    if (scrollArrow) {
        scrollArrow.addEventListener('click', () => {
            const impactSection = document.querySelector('.impact-section');
            if (impactSection) {
                impactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// Header Scroll Effect
function initHeaderScroll() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    });
}

// Mobile Menu
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
    }
}

// CTA Button Interactions
document.addEventListener('DOMContentLoaded', function() {
    // Donate Food Now button
    const donateButtons = document.querySelectorAll('.cta-primary, .closing-cta');
    donateButtons.forEach(button => {
        if (button.textContent.includes('Donate') || button.textContent.includes('Change')) {
            button.addEventListener('click', function() {
                showNotification('🎉 Thank you for your interest! Feature coming soon.', 'success');
            });
        }
    });

    // Claim Food buttons
    const claimButtons = document.querySelectorAll('.cta-secondary, .claim-button');
    claimButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (button.textContent.includes('Claim')) {
                showNotification('📱 Claiming feature will be available soon!', 'info');
            } else {
                showNotification('🔍 Food search feature coming soon!', 'info');
            }
        });
    });

    // Demo button
    const demoButton = document.querySelector('.demo-button');
    if (demoButton) {
        demoButton.addEventListener('click', function() {
            showNotification('🚀 Live demo will be available soon!', 'info');
        });
    }

    // Login button
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('🔐 Login system coming soon!', 'info');
        });
    }
});

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">×</button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        .notification-close:hover {
            opacity: 1;
        }
    `;
    
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Intersection Observer for sections
function observeSections() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentSection = entry.target.getAttribute('id');
                
                // Update active nav link
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSection}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-100px 0px -100px 0px'
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });
}

// Initialize section observation
document.addEventListener('DOMContentLoaded', observeSections);

// Performance optimization - Lazy load background images
function initLazyLoading() {
    const lazyElements = document.querySelectorAll('[data-bg]');
    
    const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                element.style.backgroundImage = `url(${element.dataset.bg})`;
                element.removeAttribute('data-bg');
                lazyImageObserver.unobserve(element);
            }
        });
    });

    lazyElements.forEach(element => {
        lazyImageObserver.observe(element);
    });
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', initLazyLoading);

// Add some interactive hover effects
document.addEventListener('DOMContentLoaded', function() {
    // Hero CTA hover effects
    const ctaButtons = document.querySelectorAll('.cta-primary, .cta-secondary');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Card tilt effect on mouse move
    const cards = document.querySelectorAll('.step-card, .listing-card, .hero-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
});

// Fetch and display real-time data (placeholder for backend integration)
async function fetchDashboardData() {
    try {
        const response = await fetch('/dashboard');
        if (response.ok) {
            const data = await response.json();
            updateCounters(data);
        }
    } catch (error) {
        console.log('Dashboard data not available, using default values');
    }
}

function updateCounters(data) {
    const counters = {
        'meals': data.savedFood || 25400,
        'people': data.peopleFed || 18000,
        'water': data.waterSaved || 120000
    };
    
    Object.keys(counters).forEach(key => {
        const counter = document.querySelector(`[data-counter="${key}"]`);
        if (counter) {
            counter.setAttribute('data-target', counters[key]);
        }
    });
}

// Initialize dashboard data fetch
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fetchDashboardData, 1000);
});

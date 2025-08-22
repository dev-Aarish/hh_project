// Global variables and utilities
let isAnimating = false;

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initAnimations();
    initCounters();
    initFormHandling();
    initScrollEffects();
    initMobileMenu();
});

// Navigation functionality
function initNavigation() {
    const navLinks = $$('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = $('#' + targetId);
            
            if (targetElement) {
                const headerHeight = $('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const hamburger = $('.hamburger');
    const navMenu = $('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = $$('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
}

// Animated counters for metrics
function initCounters() {
    const counters = $$('.metric-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.hasAttribute('data-animated')) {
                animateCounter(entry.target);
                entry.target.setAttribute('data-animated', 'true');
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target')) || 0;
    const duration = 2000; // 2 seconds
    const step = target / (duration / 16); // 60fps
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Format numbers with commas
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Scroll-triggered animations
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animateElements = $$('.value-card, .step-card, .listing-card, .hero-card, .story-card, .sdg-card');
    animateElements.forEach(element => {
        element.classList.add('animate-on-scroll');
        scrollObserver.observe(element);
    });
}

// Initialize animations for specific sections
function initAnimations() {
    // Add CSS classes for animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-on-scroll.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .animate-on-scroll:nth-child(2) {
            transition-delay: 0.1s;
        }
        
        .animate-on-scroll:nth-child(3) {
            transition-delay: 0.2s;
        }
        
        .animate-on-scroll:nth-child(4) {
            transition-delay: 0.3s;
        }
    `;
    document.head.appendChild(style);
}

// Form handling
function initFormHandling() {
    const donorForm = $('#donorForm');
    if (donorForm) {
        donorForm.addEventListener('submit', handleDonorForm);
    }
}

function handleDonorForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const quantity = formData.get('quantity');
    const quality = formData.get('quality');
    const image = formData.get('image');
    
    // Validate form
    if (!quantity || !quality || !image) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
        showNotification('Thank you! Your food donation has been listed successfully.', 'success');
        closeDonorForm();
        e.target.reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// Modal functions
function openDonorForm() {
    const modal = $('#donorModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 300);
    }
}

function closeDonorForm() {
    const modal = $('#donorModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openReceiverOptions() {
    const modal = $('#receiverModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeReceiverOptions() {
    const modal = $('#receiverModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function selectFoodType(type) {
    let message = '';
    
    if (type === 'cooked') {
        message = 'Redirecting to cooked foods listings...';
    } else if (type === 'groceries') {
        message = 'Redirecting to grocery listings...';
    }
    
    showNotification(message, 'info');
    
    setTimeout(() => {
        closeReceiverOptions();
        // Scroll to listings section
        const listingsSection = $('#listings');
        if (listingsSection) {
            const headerHeight = $('.header').offsetHeight;
            const targetPosition = listingsSection.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }, 1500);
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const donorModal = $('#donorModal');
    const receiverModal = $('#receiverModal');
    
    if (e.target === donorModal) {
        closeDonorForm();
    }
    
    if (e.target === receiverModal) {
        closeReceiverOptions();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDonorForm();
        closeReceiverOptions();
    }
});

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = $('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="closeNotification(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10001;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        margin-left: auto;
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        closeNotification(notification);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#2d5a27';
        case 'error': return '#dc3545';
        case 'warning': return '#ff8c42';
        default: return '#4a7c59';
    }
}

function closeNotification(element) {
    const notification = element.closest ? element.closest('.notification') : element;
    if (notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

// Listing card interactions
document.addEventListener('click', (e) => {
    if (e.target.matches('.listing-card .btn') || e.target.closest('.listing-card .btn')) {
        e.preventDefault();
        const card = e.target.closest('.listing-card');
        const foodName = card.querySelector('h3').textContent;
        
        // Add visual feedback
        const btn = e.target.matches('.btn') ? e.target : e.target.closest('.btn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';
        btn.disabled = true;
        
        setTimeout(() => {
            showNotification(`Successfully claimed ${foodName}! Check your notifications for pickup details.`, 'success');
            btn.innerHTML = '<i class="fas fa-check"></i> Claimed';
            btn.style.background = '#28a745';
            
            // Simulate removing the listing after claim
            setTimeout(() => {
                card.style.opacity = '0.5';
                card.style.transform = 'scale(0.95)';
                
                const badge = document.createElement('div');
                badge.innerHTML = '<i class="fas fa-check"></i> CLAIMED';
                badge.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #28a745;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                `;
                card.style.position = 'relative';
                card.appendChild(badge);
            }, 1000);
        }, 1500);
    }
});

// Demo button functionality
document.addEventListener('click', (e) => {
    if (e.target.matches('.btn:contains("Try a Live Demo")') || 
        e.target.textContent.includes('Try a Live Demo')) {
        e.preventDefault();
        showNotification('Demo feature coming soon! You can explore the live listings below.', 'info');
        
        // Scroll to listings
        setTimeout(() => {
            const listingsSection = $('#listings');
            if (listingsSection) {
                const headerHeight = $('.header').offsetHeight;
                const targetPosition = listingsSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 1000);
    }
});

// CTA button functionality
document.addEventListener('click', (e) => {
    if (e.target.matches('.btn:contains("Be Part of the Change")') || 
        e.target.textContent.includes('Be Part of the Change')) {
        e.preventDefault();
        
        // Show options to user
        const choice = confirm('How would you like to get involved?\n\nOK = Donate Food\nCancel = Receive Food');
        
        if (choice) {
            openDonorForm();
        } else {
            openReceiverOptions();
        }
    }
});

// Header scroll effect
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const header = $('.header');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        header.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop;
    
    // Add shadow when scrolled
    if (scrollTop > 50) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    }
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = $('.hero-background');
    
    if (heroBackground) {
        const rate = scrolled * -0.5;
        heroBackground.style.transform = `translate3d(0, ${rate}px, 0)`;
    }
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Trigger hero animations
    const heroTitle = $('.hero-title');
    const heroSubtitle = $('.hero-subtitle');
    const heroButtons = $('.hero-buttons');
    
    if (heroTitle) heroTitle.style.animationDelay = '0s';
    if (heroSubtitle) heroSubtitle.style.animationDelay = '0.2s';
    if (heroButtons) heroButtons.style.animationDelay = '0.4s';
});

// FAQ functionality (if needed later)
function toggleFAQ(element) {
    const content = element.nextElementSibling;
    const icon = element.querySelector('.faq-icon');
    
    if (content.style.display === 'block') {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    }
}

// Auto-incrementing metrics with specific timing
let metricsData = {
    cities: 12,        // Start with base values
    partners: 150,
    users: 2450,
    meals: 15000,
    people: 12500,
    water: 35000
};

let metricsIntervals = {};

function initializeMetrics() {
    const metricElements = $$('.metric-number');
    const metricKeys = ['cities', 'partners', 'users', 'meals', 'people', 'water'];

    // Set initial values
    metricElements.forEach((element, index) => {
        if (metricKeys[index]) {
            element.textContent = metricsData[metricKeys[index]].toLocaleString();
        }
    });
}

function startAutoIncrementMetrics() {
    const metricElements = $$('.metric-number');
    const metricKeys = ['cities', 'partners', 'users', 'meals', 'people', 'water'];

    // Clear any existing intervals
    Object.values(metricsIntervals).forEach(interval => clearInterval(interval));

    // Cities: +1 every 60 seconds
    metricsIntervals.cities = setInterval(() => {
        metricsData.cities += 1;
        updateMetricDisplay(0, metricsData.cities);
    }, 60000);

    // Partners: +1 every 30 seconds
    metricsIntervals.partners = setInterval(() => {
        metricsData.partners += 1;
        updateMetricDisplay(1, metricsData.partners);
    }, 30000);

    // Active Users: +1 every 20 seconds
    metricsIntervals.users = setInterval(() => {
        metricsData.users += 1;
        updateMetricDisplay(2, metricsData.users);
    }, 20000);

    // Meals Saved: +5 every 10 seconds
    metricsIntervals.meals = setInterval(() => {
        metricsData.meals += 5;
        updateMetricDisplay(3, metricsData.meals);
    }, 10000);

    // People Fed: +10 every 20 seconds
    metricsIntervals.people = setInterval(() => {
        metricsData.people += 10;
        updateMetricDisplay(4, metricsData.people);
    }, 20000);

    // Water Saved: +2 litres every 10 seconds
    metricsIntervals.water = setInterval(() => {
        metricsData.water += 2;
        updateMetricDisplay(5, metricsData.water);
    }, 10000);
}

function updateMetricDisplay(index, value) {
    const metricElements = $$('.metric-number');
    if (metricElements[index]) {
        // Add a subtle animation effect
        metricElements[index].style.transform = 'scale(1.1)';
        metricElements[index].style.color = 'var(--soft-orange)';

        setTimeout(() => {
            metricElements[index].textContent = value.toLocaleString();
            metricElements[index].style.transform = 'scale(1)';
            metricElements[index].style.color = 'var(--primary-green)';
        }, 200);
    }
}

// Initialize metrics on page load
function initMetricsSystem() {
    initializeMetrics();

    // Start auto-increment after initial animation
    setTimeout(() => {
        startAutoIncrementMetrics();
    }, 3000); // Wait 3 seconds after page load
}

// Service Worker registration (for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for global access
window.openDonorForm = openDonorForm;
window.closeDonorForm = closeDonorForm;
window.openReceiverOptions = openReceiverOptions;
window.closeReceiverOptions = closeReceiverOptions;
window.selectFoodType = selectFoodType;
window.closeNotification = closeNotification;
window.toggleFAQ = toggleFAQ;

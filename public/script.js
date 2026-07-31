/* ============================================
   DAILY PRIMES - JAVASCRIPT FUNCTIONALITY
   Modern Interactive Website Features
   ============================================ */

// ============================================
// Document Ready Event
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeHamburgerMenu();
    initializeSmoothScroll();
    initializeFormValidation();
    initializeNavbarScroll();
    initializeScrollAnimations();
});

// ============================================
// HAMBURGER MENU - Mobile Navigation
// ============================================
function initializeHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (!hamburger) return;
    
    // Toggle menu on click
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!navLinks) return;
        navLinks.classList.toggle('mobile-active');
        hamburger.classList.toggle('active');
        const expanded = navLinks.classList.contains('mobile-active');
        hamburger.setAttribute('aria-expanded', expanded);
    });

    // Toggle on Enter / Space for keyboard users
    hamburger.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            hamburger.click();
        }
    });
    
    // Close menu when clicking on a link
    if (navLinks) {
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('mobile-active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }
    
    // Close menu when clicking outside
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.navbar')) {
            if (navLinks) navLinks.classList.remove('mobile-active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
}

// Prevent navigation on temporarily disabled nav links (data-disabled="true")
function initializeDisabledNavLinks() {
    const disabledLinks = document.querySelectorAll('a[data-disabled="true"]');
    disabledLinks.forEach(link => {
        // guard in case pointer-events is not supported
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
            }
        });
    });
}

// run disabled link initializer
document.addEventListener('DOMContentLoaded', function() {
    initializeDisabledNavLinks();
});

// ============================================
// SMOOTH SCROLL - Navigation Links
// ============================================
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#') return;
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                
                // Calculate offset for fixed navbar
                const navHeight = 80;
                const targetPosition = target.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// NAVBAR SCROLL - Add shadow on scroll
// ============================================
function initializeNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(212, 175, 55, 0.2)';
        } else {
            navbar.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.1)';
        }
    });
}

// ============================================
// FORM VALIDATION - Contact Form
// ============================================
function initializeFormValidation() {
    const form = document.getElementById('contactForm');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear all previous errors
        clearAllErrors();
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();
        const subscribe = document.getElementById('subscribe').checked;
        
        // Validate fields
        let isValid = true;
        
        if (!name || name.length < 2) {
            showError('nameError', 'Please enter a valid name (at least 2 characters)');
            isValid = false;
        }
        
        if (!email || !validateEmail(email)) {
            showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!subject || subject.length < 3) {
            showError('subjectError', 'Please enter a subject (at least 3 characters)');
            isValid = false;
        }
        
        if (!message || message.length < 10) {
            showError('messageError', 'Please enter a message (at least 10 characters)');
            isValid = false;
        }
        
        // If valid, show success message
        if (isValid) {
            showSuccessMessage();
            form.reset();
            
            // Log form data (in production, send to server)
            console.log('Form submitted:', {
                name: name,
                email: email,
                subject: subject,
                message: message,
                subscribe: subscribe,
                timestamp: new Date()
            });
            
            // Hide success message after 5 seconds
            setTimeout(hideSuccessMessage, 5000);
        }
    });
    
    // Real-time validation on input
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('focus', function() {
            clearFieldError(this);
        });
    });
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate individual field
function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const errorId = fieldName + 'Error';
    
    let isValid = true;
    let errorMessage = '';
    
    if (fieldName === 'name' && (!value || value.length < 2)) {
        isValid = false;
        errorMessage = 'Please enter a valid name';
    } else if (fieldName === 'email' && (!value || !validateEmail(value))) {
        isValid = false;
        errorMessage = 'Please enter a valid email';
    } else if (fieldName === 'subject' && (!value || value.length < 3)) {
        isValid = false;
        errorMessage = 'Please enter a subject';
    } else if (fieldName === 'message' && (!value || value.length < 10)) {
        isValid = false;
        errorMessage = 'Message must be at least 10 characters';
    }
    
    if (!isValid) {
        showError(errorId, errorMessage);
    }
}

// Show error message
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Clear field error
function clearFieldError(field) {
    const errorId = field.name + 'Error';
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }
}

// Clear all errors
function clearAllErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => {
        error.classList.remove('show');
        error.textContent = '';
    });
}

// Show success message
function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'flex';
        successMessage.style.animation = 'slideUp 0.5s ease-out';
    }
}

// Hide success message
function hideSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// ============================================
// SCROLL ANIMATIONS - Fade in on scroll
// ============================================
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe blog cards, offering cards, stat cards
    const elementsToObserve = document.querySelectorAll(
        '.blog-card, .offering-card, .stat-card, .social-card, .faq-item, .tribute-image'
    );
    
    elementsToObserve.forEach(element => {
        observer.observe(element);
    });
}

// ============================================
// UTILITY - Active Link Highlighting
// ============================================
function highlightActiveLink() {
    const currentLocation = location.pathname;
    const links = document.querySelectorAll('.nav-links a');
    
    links.forEach(link => {
        if (link.getAttribute('href') === currentLocation) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Run on page load
highlightActiveLink();

// ============================================
// UTILITY - Scroll to top on page load
// ============================================
window.addEventListener('load', function() {
    window.scrollTo(0, 0);
});

// ============================================
// UTILITY - Print page info
// ============================================
console.log('%c🎯 Daily Primes - Football Excellence Channel', 
    'font-size: 18px; font-weight: bold; color: #d4af37; text-shadow: 2px 2px 4px rgba(0,0,0,0.5)');
console.log('%cYour destination for the best football content and Cristiano Ronaldo updates!',
    'font-size: 14px; color: #b0b0b0; font-style: italic');
console.log('%cSubscribe: https://www.youtube.com/channel/UCnSUPkD48P03XqOLnudRBUg',
    'font-size: 12px; color: #808080');

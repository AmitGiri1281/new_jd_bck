/**
 * J.D. Computer Education - Main JavaScript File
 * Contains all interactive functionality for the website
 */

document.addEventListener('DOMContentLoaded', function() {

    // =============================================
    // Mobile Menu Toggle
    // =============================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn') || document.querySelector('.mobile-menu');
    const navLinks = document.getElementById('nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // =============================================
    // Sticky Header on Scroll
    // =============================================
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
                header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            } else {
                header.classList.remove('scrolled');
                header.style.boxShadow = 'none';
            }
        });
    }

    // =============================================
    // Active Link Highlighting
    // =============================================
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // =============================================
    // Testimonial Slider
    // =============================================
    const testimonials = [
        {
            content: "The faculty at JD Computer helped me secure a government job after completing my DCA. The practical training was excellent!",
            name: "Ramesh Kumar",
            course: "DCA Student",
            rating: 5,
            image: "images/student1.jpg"
        },
        {
            content: "I learned Hindi typing in just 2 months and got a job as data entry operator. Thanks to JD Computer for quality training.",
            name: "Priya Singh",
            course: "Typing Course",
            rating: 4,
            image: "images/student2.jpg"
        },
        {
            content: "The NIELIT 'O' Level course gave me strong fundamentals that helped me get admission in BCA with scholarship.",
            name: "Amit Patel",
            course: "O Level Student",
            rating: 5,
            image: "images/student3.jpg"
        }
    ];

    const testimonialContainer = document.querySelector('.testimonial-slider');
    let currentTestimonial = 0;

    function showTestimonial(index) {
        if (testimonialContainer) {
            const testimonial = testimonials[index];
            let stars = '';
            for (let i = 0; i < testimonial.rating; i++) {
                stars += '<i class="fas fa-star"></i>';
            }

            testimonialContainer.innerHTML = `
                <div class="testimonial-item">
                    <div class="testimonial-content">
                        <p>${testimonial.content}</p>
                    </div>
                    <div class="testimonial-author">
                        <img src="${testimonial.image}" alt="${testimonial.name}">
                        <div>
                            <span class="name">${testimonial.name}</span>
                            <span class="course">${testimonial.course}</span>
                            <div class="rating">${stars}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    if (testimonialContainer) {
        showTestimonial(currentTestimonial);
        setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            showTestimonial(currentTestimonial);
        }, 5000);
    }

    // =============================================
    // Course Filtering (courses.html)
    // =============================================
    const courseBoxes = document.querySelectorAll('.course-box');
    const categoryButtons = document.querySelectorAll('.category-btn');

    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const category = button.dataset.category;
                courseBoxes.forEach(box => {
                    if (category === 'all' || box.classList.contains(category)) {
                        box.style.display = 'block';
                    } else {
                        box.style.display = 'none';
                    }
                });
            });
        });
    }

    // =============================================
    // Smooth Scrolling for Anchor Links
    // =============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                history.pushState(null, null, targetId);
            }
        });
    });

    // =============================================
    // Contact Form Handling
    // =============================================
    const contactForm = document.getElementById('contactForm') || document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const formValues = Object.fromEntries(formData.entries());

            if (!formValues.name || !formValues.email || !formValues.message) {
                alert('Please fill in all required fields');
                return;
            }

            console.log('Form submitted:', formValues);
            alert('Thank you for your message! We will contact you soon.');
            this.reset();
        });
    }

    // =============================================
    // Gallery Lightbox (gallery.html)
    // =============================================
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems.length > 0) {
        const lightbox = document.createElement('div');
        lightbox.id = 'lightbox-overlay';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <span class="lightbox-close">&times;</span>
                <img class="lightbox-image" src="" alt="Gallery Image">
                <div class="lightbox-caption"></div>
                <button class="lightbox-prev"><i class="fas fa-chevron-left"></i></button>
                <button class="lightbox-next"><i class="fas fa-chevron-right"></i></button>
            </div>
        `;
        document.body.appendChild(lightbox);

        let currentImageIndex = 0;
        const images = Array.from(galleryItems);

        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                currentImageIndex = index;
                updateLightbox();
                lightbox.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        });

        function updateLightbox() {
            const imgSrc = images[currentImageIndex].querySelector('img').src;
            const caption = images[currentImageIndex].dataset.caption || '';
            lightbox.querySelector('.lightbox-image').src = imgSrc;
            lightbox.querySelector('.lightbox-caption').textContent = caption;
        }

        lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        lightbox.querySelector('.lightbox-prev').addEventListener('click', (e) => {
            e.stopPropagation();
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            updateLightbox();
        });

        lightbox.querySelector('.lightbox-next').addEventListener('click', (e) => {
            e.stopPropagation();
            currentImageIndex = (currentImageIndex + 1) % images.length;
            updateLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (lightbox.style.display === 'flex') {
                if (e.key === 'Escape') {
                    lightbox.style.display = 'none';
                    document.body.style.overflow = 'auto';
                } else if (e.key === 'ArrowLeft') {
                    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
                    updateLightbox();
                } else if (e.key === 'ArrowRight') {
                    currentImageIndex = (currentImageIndex + 1) % images.length;
                    updateLightbox();
                }
            }
        });

        // Gallery Filter
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filter = button.dataset.filter;
                galleryItems.forEach(item => {
                    if (filter === 'all' || item.classList.contains(filter)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // =============================================
    // Current Year in Footer
    // =============================================
    const yearElement = document.querySelector('.current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

});





// add popup form
// Show the pop-up after the page loads
window.onload = function() {
  setTimeout(function() {
    document.getElementById('popup-overlay').style.display = 'flex';
  }, 2000); // Show after 2 seconds (you can adjust this time)
};

// Close the pop-up when clicking the close button
document.getElementById('close-btn').addEventListener('click', function() {
  document.getElementById('popup-overlay').style.display = 'none';
});




document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      courseCompleted: form.courseCompleted.value,
      courseInterested: form.courseInterested.value,
      message: form.message.value.trim()
    };

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      alert(result.message);
      form.reset();
    } catch (error) {
      alert('Failed to send message.');
      console.error(error);
    }
  });
});


document.getElementById('contactForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    courseCompleted: document.getElementById('course-completed').value,
    courseInterested: document.getElementById('course-interested').value,
    message: document.getElementById('message').value
  };

  const response = await fetch('http://localhost:3000/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await response.text();
  alert(result);
});

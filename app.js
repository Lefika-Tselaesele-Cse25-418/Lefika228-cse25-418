(function () {
  const CARS = window.FIKSPOINT_CARS || [];

  const STORAGE_KEYS = {
    cart: 'fikspoint_cart',
    bookings: 'fikspoint_bookings',
    inquiries: 'fikspoint_inquiries',
    user: 'fikspoint_user'
  };

  function formatPrice(value) {
    return `BWP ${Number(value || 0).toLocaleString('en-BW')}`;
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setCurrentYear() {
    const yearTargets = document.querySelectorAll('[data-current-year]');
    yearTargets.forEach((target) => {
      target.textContent = String(new Date().getFullYear());
    });
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    if (!page) {
      return;
    }

    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.dataset.nav === page) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function getAvailabilityClass(availability) {
    return availability === 'In Stock' ? 'badge-availability' : 'badge-unavailable';
  }

  function toMileageText(mileage) {
    if (!mileage) {
      return 'Brand New';
    }
    return `${Number(mileage).toLocaleString('en-BW')} km`;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }

  function addToCart(carId) {
    const car = CARS.find((item) => item.id === carId);
    if (!car) {
      return false;
    }

    const cart = getCart();
    const exists = cart.some((item) => item.id === carId);
    if (!exists) {
      cart.push({ id: car.id, addedAt: new Date().toISOString() });
      saveCart(cart);
    }

    return true;
  }

  function removeFromCart(carId) {
    const cart = getCart().filter((item) => item.id !== carId);
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  function createCard(car, options) {
    const settings = {
      showBuy: true,
      showBook: true,
      ...options
    };

    return `
      <div class="col-md-6 col-xl-4 fade-up">
        <article class="card vehicle-card h-100">
          <img src="${car.image}" class="card-img-top" alt="${car.name}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h3 class="h5 mb-0">${car.name}</h3>
              <span class="badge ${getAvailabilityClass(car.availability)}">${car.availability}</span>
            </div>
            <p class="section-subtitle small mb-2">${car.year} | ${car.transmission} | ${car.fuel}</p>
            <p class="vehicle-price mb-3">${formatPrice(car.price)}</p>
            <ul class="small text-secondary ps-3 mb-3">
              <li>Mileage: ${toMileageText(car.mileage)}</li>
              <li>Condition: ${car.condition}</li>
              <li>Color: ${car.color}</li>
            </ul>
            <div class="d-flex gap-2 mt-auto flex-wrap">
              <a class="btn btn-sm btn-outline-primary" href="car-details.html?id=${car.id}">View details</a>
              ${settings.showBook ? `<a class="btn btn-sm btn-outline-brand" href="service-booking.html?car=${car.id}">Book service</a>` : ''}
              ${settings.showBuy ? `<button class="btn btn-sm btn-brand" data-buy-id="${car.id}" ${car.availability !== 'In Stock' ? 'disabled' : ''}>Buy now</button>` : ''}
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function showInlineMessage(target, type, message) {
    if (!target) {
      return;
    }

    target.className = `alert alert-${type}`;
    target.textContent = message;
    target.classList.remove('d-none');
  }

  function initHome() {
    const featuredGrid = document.getElementById('featuredCars');
    if (featuredGrid) {
      const featured = CARS.slice(0, 4);
      featuredGrid.innerHTML = featured.map((car) => createCard(car)).join('');
    }

    const searchForm = document.getElementById('homeSearchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const brand = document.getElementById('searchBrand').value.trim();
        const model = document.getElementById('searchModel').value.trim();
        const maxPrice = document.getElementById('searchPrice').value.trim();

        const params = new URLSearchParams();
        if (brand) params.set('brand', brand);
        if (model) params.set('model', model);
        if (maxPrice) params.set('maxPrice', maxPrice);

        window.location.href = `listings.html${params.toString() ? `?${params.toString()}` : ''}`;
      });
    }
  }

  function initListings() {
    const listingGrid = document.getElementById('listingGrid');
    if (!listingGrid) {
      return;
    }

    const countTarget = document.getElementById('listingCount');
    const brandFilter = document.getElementById('brandFilter');
    const modelFilter = document.getElementById('modelFilter');
    const priceFilter = document.getElementById('priceFilter');
    const priceValue = document.getElementById('priceValue');
    const conditionFilter = document.getElementById('conditionFilter');
    const resetFilters = document.getElementById('resetFilters');
    const listingMessage = document.getElementById('listingMessage');

    const uniqueBrands = [...new Set(CARS.map((car) => car.brand))].sort();
    uniqueBrands.forEach((brand) => {
      const option = document.createElement('option');
      option.value = brand;
      option.textContent = brand;
      brandFilter.appendChild(option);
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('brand')) brandFilter.value = params.get('brand');
    if (params.get('model')) modelFilter.value = params.get('model');
    if (params.get('maxPrice')) priceFilter.value = params.get('maxPrice');

    if (priceValue) {
      priceValue.textContent = formatPrice(priceFilter.value);
    }

    function renderCars() {
      const brand = brandFilter.value.trim().toLowerCase();
      const model = modelFilter.value.trim().toLowerCase();
      const maxPrice = Number(priceFilter.value || 0);
      const condition = conditionFilter.value.trim().toLowerCase();

      const filtered = CARS.filter((car) => {
        const brandMatch = !brand || car.brand.toLowerCase() === brand;
        const modelMatch = !model || car.model.toLowerCase().includes(model) || car.name.toLowerCase().includes(model);
        const priceMatch = !maxPrice || car.price <= maxPrice;
        const conditionMatch = !condition || car.condition.toLowerCase() === condition;

        return brandMatch && modelMatch && priceMatch && conditionMatch;
      });

      if (countTarget) {
        countTarget.textContent = `${filtered.length} vehicle${filtered.length === 1 ? '' : 's'} found`;
      }

      if (!filtered.length) {
        listingGrid.innerHTML = `
          <div class="col-12">
            <div class="alert alert-warning mb-0">No cars matched your filters. Please adjust and try again.</div>
          </div>
        `;
      } else {
        listingGrid.innerHTML = filtered.map((car) => createCard(car)).join('');
      }
    }

    [brandFilter, modelFilter, conditionFilter].forEach((control) => {
      control.addEventListener('input', renderCars);
      control.addEventListener('change', renderCars);
    });

    priceFilter.addEventListener('input', () => {
      if (priceValue) {
        priceValue.textContent = formatPrice(priceFilter.value);
      }
      renderCars();
    });

    resetFilters.addEventListener('click', () => {
      brandFilter.value = '';
      modelFilter.value = '';
      conditionFilter.value = '';
      priceFilter.value = priceFilter.max;
      if (priceValue) {
        priceValue.textContent = formatPrice(priceFilter.value);
      }
      renderCars();
    });

    listingGrid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-buy-id]');
      if (!button) {
        return;
      }
      const added = addToCart(button.dataset.buyId);
      if (added) {
        showInlineMessage(listingMessage, 'success', 'Vehicle added to purchase list. You can complete checkout now.');
      }
    });

    renderCars();
  }

  function initCarDetails() {
    const detailsContainer = document.getElementById('carDetailsSection');
    if (!detailsContainer) {
      return;
    }

    const carId = getQueryParam('id');
    const car = CARS.find((item) => item.id === carId) || CARS[0];

    const title = document.getElementById('detailTitle');
    const image = document.getElementById('detailImage');
    const price = document.getElementById('detailPrice');
    const description = document.getElementById('detailDescription');
    const specs = document.getElementById('detailSpecs');
    const features = document.getElementById('detailFeatures');
    const availability = document.getElementById('detailAvailability');
    const buyBtn = document.getElementById('detailsBuyBtn');
    const inquiryForm = document.getElementById('detailInquiryForm');
    const detailMessage = document.getElementById('detailMessage');

    title.textContent = car.name;
    image.src = car.image;
    image.alt = car.name;
    price.textContent = formatPrice(car.price);
    description.textContent = car.description;
    availability.textContent = car.availability;
    availability.className = `badge ${getAvailabilityClass(car.availability)} px-3 py-2`;

    specs.innerHTML = `
      <li class="list-group-item d-flex justify-content-between"><span>Brand</span><strong>${car.brand}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Model</span><strong>${car.model}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Year</span><strong>${car.year}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Mileage</span><strong>${toMileageText(car.mileage)}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Transmission</span><strong>${car.transmission}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Fuel</span><strong>${car.fuel}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Condition</span><strong>${car.condition}</strong></li>
      <li class="list-group-item d-flex justify-content-between"><span>Color</span><strong>${car.color}</strong></li>
    `;

    features.innerHTML = car.features.map((feature) => `<li>${feature}</li>`).join('');

    buyBtn.disabled = car.availability !== 'In Stock';

    buyBtn.addEventListener('click', () => {
      const added = addToCart(car.id);
      if (added) {
        window.location.href = 'checkout.html';
      }
    });

    inquiryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = Object.fromEntries(new FormData(inquiryForm).entries());
      const record = {
        carId: car.id,
        ...formData,
        createdAt: new Date().toISOString()
      };

      const inquiries = JSON.parse(localStorage.getItem(STORAGE_KEYS.inquiries) || '[]');
      inquiries.push(record);
      localStorage.setItem(STORAGE_KEYS.inquiries, JSON.stringify(inquiries));

      showInlineMessage(detailMessage, 'success', 'Thanks. Your inquiry was submitted and our sales team will contact you shortly.');
      inquiryForm.reset();
    });
  }

  function initServiceBooking() {
    const bookingForm = document.getElementById('serviceBookingForm');
    if (!bookingForm) {
      return;
    }

    const selectedCar = getQueryParam('car');
    const vehicleField = document.getElementById('vehicleModel');
    const bookingMessage = document.getElementById('bookingMessage');

    if (selectedCar) {
      const car = CARS.find((item) => item.id === selectedCar);
      if (car) {
        vehicleField.value = `${car.brand} ${car.model}`;
      }
    }

    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const booking = Object.fromEntries(new FormData(bookingForm).entries());
      booking.reference = `FIK-${Date.now().toString().slice(-6)}`;
      booking.createdAt = new Date().toISOString();

      const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '[]');
      bookings.push(booking);
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));

      showInlineMessage(
        bookingMessage,
        'success',
        `Service booking confirmed. Your reference number is ${booking.reference}.`
      );

      bookingForm.reset();
      if (selectedCar) {
        const car = CARS.find((item) => item.id === selectedCar);
        if (car) {
          vehicleField.value = `${car.brand} ${car.model}`;
        }
      }
    });
  }

  function initContact() {
    const form = document.getElementById('contactForm');
    if (!form) {
      return;
    }

    const selectedCar = getQueryParam('car');
    const vehicleField = document.getElementById('contactVehicle');
    const contactMessage = document.getElementById('contactMessage');

    if (selectedCar && vehicleField) {
      const car = CARS.find((item) => item.id === selectedCar);
      if (car) {
        vehicleField.value = `${car.brand} ${car.model}`;
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const request = Object.fromEntries(new FormData(form).entries());
      request.createdAt = new Date().toISOString();

      const inquiries = JSON.parse(localStorage.getItem(STORAGE_KEYS.inquiries) || '[]');
      inquiries.push(request);
      localStorage.setItem(STORAGE_KEYS.inquiries, JSON.stringify(inquiries));

      showInlineMessage(contactMessage, 'success', 'Your message was sent. A consultant will contact you soon.');
      form.reset();
    });
  }

  function initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) {
      return;
    }

    const loginMessage = document.getElementById('loginMessage');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      if (!payload.email || !payload.password) {
        showInlineMessage(loginMessage, 'danger', 'Please enter both email address and password.');
        return;
      }

      localStorage.setItem(
        STORAGE_KEYS.user,
        JSON.stringify({
          email: payload.email,
          loggedInAt: new Date().toISOString()
        })
      );

      showInlineMessage(loginMessage, 'success', 'Login successful. Redirecting to purchase checkout...');
      window.setTimeout(() => {
        window.location.href = 'checkout.html';
      }, 900);
    });
  }

  function initCheckout() {
    const container = document.getElementById('checkoutSummary');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutMessage = document.getElementById('checkoutMessage');

    if (!container || !checkoutForm || !checkoutMessage) {
      return;
    }

    function renderCheckoutState() {
      const cart = getCart();

      if (!cart.length) {
        container.innerHTML = `
          <div class="alert alert-info mb-0">
            Your purchase list is empty. Please select a vehicle from the listings page first.
            <a href="listings.html" class="alert-link">Browse vehicles</a>
          </div>
        `;
        checkoutForm.classList.add('d-none');
        return;
      }

      const carsInCart = cart
        .map((item) => CARS.find((car) => car.id === item.id))
        .filter(Boolean);

      const total = carsInCart.reduce((sum, car) => sum + car.price, 0);

      container.innerHTML = `
        <ul class="list-group list-group-flush mb-3">
          ${carsInCart
            .map(
              (car) => `
            <li class="list-group-item px-0 d-flex justify-content-between align-items-center">
              <div>
                <strong>${car.name}</strong>
                <p class="text-muted small mb-0">${car.year} | ${car.condition}</p>
              </div>
              <div class="text-end">
                <p class="mb-1 fw-semibold">${formatPrice(car.price)}</p>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-remove-id="${car.id}">Remove</button>
              </div>
            </li>`
            )
            .join('')}
        </ul>
        <div class="d-flex justify-content-between align-items-center border-top pt-3">
          <span class="fw-semibold">Estimated Total</span>
          <span class="h5 m-0">${formatPrice(total)}</span>
        </div>
      `;
      checkoutForm.classList.remove('d-none');
    }

    if (!container.dataset.boundRemoveHandler) {
      container.addEventListener('click', (event) => {
        const removeBtn = event.target.closest('[data-remove-id]');
        if (!removeBtn) {
          return;
        }
        removeFromCart(removeBtn.dataset.removeId);
        renderCheckoutState();
      });
      container.dataset.boundRemoveHandler = 'true';
    }

    if (!checkoutForm.dataset.boundSubmitHandler) {
      checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const orderData = Object.fromEntries(new FormData(checkoutForm).entries());
        if (!orderData.fullName || !orderData.email || !orderData.phone || !orderData.paymentMethod) {
          showInlineMessage(checkoutMessage, 'danger', 'Please complete all required checkout fields.');
          return;
        }

        const orderRef = `ORD-${Date.now().toString().slice(-8)}`;
        clearCart();
        showInlineMessage(
          checkoutMessage,
          'success',
          `Purchase request submitted successfully. Your order reference is ${orderRef}.`
        );
        checkoutForm.reset();
        renderCheckoutState();
      });
      checkoutForm.dataset.boundSubmitHandler = 'true';
    }

    renderCheckoutState();
  }

  function handleGlobalBuyButtons() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-buy-id]');
      if (!button) {
        return;
      }

      const added = addToCart(button.dataset.buyId);
      if (!added) {
        return;
      }

      const destination = button.dataset.buyRedirect;
      if (destination === 'checkout') {
        window.location.href = 'checkout.html';
      }
    });
  }

  setCurrentYear();
  setActiveNav();
  handleGlobalBuyButtons();
  initHome();
  initListings();
  initCarDetails();
  initServiceBooking();
  initContact();
  initLogin();
  initCheckout();
})();


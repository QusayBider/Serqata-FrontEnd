$(document).ready(function () {
    'use strict';

    fetchAdvertisements();

    function fetchAdvertisements() {
        $.ajax({
            url: API_CONFIG.getApiUrl('Advertisements/GetAllAdvertisements'),
            method: 'GET',
            success: function (response) {
                $('.slider-loader').fadeOut();

                if (response.success && response.data && response.data.length > 0) {
                    renderSlider(response.data);
                    renderSidebarWidget(response.data);
                } else {
                    console.log('No advertisements found or API returned error.');
                }
            },
            error: function (xhr, status, error) {
                $('.slider-loader').fadeOut();
                console.error('Error fetching advertisements:', error);
            }
        });
    }

    function renderSidebarWidget(advertisements) {
        var $slider = $('.ad-posts-slider');
        const Advertisement_smallClass = $('.Advertisement-smallClass');
        const $recentArrivalsCol = $('#recent-arrivals-col'); // Select the Recent Arrivals column

        if ($slider.length === 0) return;

        // Destroy existing carousel if initialized
        if ($slider.hasClass('owl-loaded')) {
            $slider.trigger('destroy.owl.carousel');
        }

        $slider.find('.owl-stage-outer').children().unwrap();
        $slider.removeClass('owl-center owl-loaded owl-text-select-on');
        $slider.empty();

        var itemsAdded = 0;
        advertisements.forEach(function (ad) {
            // Do NOT show in sidebar if it's already shown in the main page slider
            if (ad.showInMainPage === true || ad.ShowInMainPage === true) {
                return;
            }
            // Format date if present
            var dateStr = ad.create_at || ad.startDate || '';
            if (dateStr) {
                try {
                    var date = new Date(dateStr);
                    dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                } catch (e) {
                    dateStr = '';
                }
            }

            // Fallback for image
            var displayImage = ad.imageUrl;
            var detailLink = `Advertisements.html?id=${ad.id}`;

            var slideHtml = `
                <article class="entry">
                    <figure class="entry-media">
                        <a href="${detailLink}">
                            <img src="${displayImage}" alt="${ad.name || 'Advertisement'}">
                        </a>
                    </figure>

                    <div class="entry-body">
                        <div class="entry-meta">
                            <a href="#">${dateStr}</a>
                        </div>

                        <h5 class="entry-title">
                            <a href="${detailLink}">${ad.name || ''}</a>
                        </h5>

                        <div class="entry-content">
                            <p>${ad.description ? ad.description.substring(0, 100) + (ad.description.length > 100 ? '...' : '') : ''}</p>
                            <a href="${detailLink}" class="read-more">Read More</a>
                        </div>
                    </div>
                </article>
            `;
            $slider.append(slideHtml);
            itemsAdded++;
        });

        if (itemsAdded === 0) {
            $slider.closest('.widget-posts').hide();
            Advertisement_smallClass.hide();
            // Make Recent Arrivals full width
            if ($recentArrivalsCol.length) {
                $recentArrivalsCol.removeClass('col-lg-9').addClass('col-lg-12');
            }
            return;
        }

        // Reset to default width if ads are present
        if ($recentArrivalsCol.length) {
            $recentArrivalsCol.removeClass('col-lg-12').addClass('col-lg-9');
        }

        $slider.closest('.widget-posts').show();
        Advertisement_smallClass.show();
        $slider.owlCarousel({
            nav: false,
            dots: true,
            loop: false,
            autoHeight: true,
            margin: 20,
            responsive: {
                0: {
                    items: 1
                }
            }
        });
    }

    function renderSlider(advertisements) {
        var $slider = $('.intro-slider');

        // Destroy existing carousel if initialized
        if ($slider.hasClass('owl-loaded')) {
            $slider.trigger('destroy.owl.carousel');
        }

        $slider.find('.owl-stage-outer').children().unwrap();
        $slider.removeClass('owl-center owl-loaded owl-text-select-on');

        // Clear existing content
        $slider.empty();

        // Build new slides
        advertisements.forEach(function (ad) {
            // Handle both camelCase and PascalCase to be safe
            if (ad.showInMainPage === true) {
                var slideHtml = `
                    <div class="intro-slide" style="background-image: url('${ad.imageUrl || ''}');">
                        <div class="container">
                            <div class="intro-content text-center">
                                <h3 class="intro-subtitle cross-txt text-primary">${ad.upText || ''}</h3>
                                <h1 class="intro-title text-white">${ad.name || ''}</h1>
                                <div class="intro-text text-white">${ad.description || ''}</div>
                                <div class="intro-action cross-txt">
                                    <a href="Advertisements.html?id=${ad.id}" class="btn btn-outline-white">
                                        <span>${ad.downText || 'Discover More'}</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                $slider.append(slideHtml);
            }
        });

        $slider.owlCarousel({
            dots: true,
            nav: false,
            loop: true,
            margin: 0,
            responsive: {
                0: {
                    items: 1
                }
            }
        });
    }
});

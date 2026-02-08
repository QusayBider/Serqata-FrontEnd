$(document).ready(function () {
    'use strict';

    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const adId = urlParams.get('id');

    if (!adId) {
        showError('No advertisement specified.');
        return;
    }

    fetchAdvertisementDetails(adId);

    function fetchAdvertisementDetails(id) {
        $.ajax({
            url: API_CONFIG.getApiUrl('Advertisements/GetAdvertisementById/' + id),
            method: 'GET',
            success: function (response) {
                if (response.success && response.data) {
                    renderAdvertisementDetails(response.data);
                } else {
                    showError('Advertisement not found.');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error fetching advertisements:', error);
                showError('Error loading advertisement details. Please try again later.');
            }
        });
    }

    function renderAdvertisementDetails(ad) {
        // Update Title
        $('#ad-title').text(ad.name || 'Untitled Advertisement');

        // Update Breadcrumb
        $('.breadcrumb-item.active').text(ad.name || 'Advertisement Details');

        // Update Date
        var dateStr = ad.create_at || ad.startDate || '';
        if (dateStr) {
            try {
                var date = new Date(dateStr);
                dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch (e) {
                dateStr = '';
            }
        }
        $('#ad-date').text(dateStr);

        const description = ad.description || 'No description available.';
        $('#ad-content').html(`<p>${description.replace(/\n/g, '<br>')}</p>`);

        // Update Image
        if (ad.imageUrl) {
            const imageHtml = `<div class="pb-1"></div><img src="${ad.imageUrl}" alt="${ad.name}">`;
            $('#ad-content').append(imageHtml);
        }
    }

    function showError(message) {
        $('#ad-title').text('Error');
        $('#ad-content').html(`<div class="alert alert-danger">${message}</div>`);
        $('#ad-date').text('');
    }
});

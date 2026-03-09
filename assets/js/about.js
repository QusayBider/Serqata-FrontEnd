// Fetch company data and update about us page
async function loadCompanyData() {
    try {
        const apiUrl = window.API_CONFIG.getApiUrl('Company/GetCompany');
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.success && result.data) {
            const company = result.data;
            
            // Update company name
            const companyNameElement = document.getElementById('companyName');
            if (companyNameElement) {
                companyNameElement.textContent = company.name;
            }
            
            // Update about us content
            const aboutUsElement = document.getElementById('aboutUsContent');
            if (aboutUsElement) {
                aboutUsElement.textContent = company.aboutUs || company.description;
            }
            
            // Update company image
            const companyImageElement = document.getElementById('companyImage');
            if (companyImageElement && company.imageUrl) {
                companyImageElement.src = company.imageUrl;
            }    
        }
    } catch (error) {
        console.error('Error loading company data:', error);
        const aboutUsElement = document.getElementById('aboutUsContent');
        if (aboutUsElement) {
            aboutUsElement.textContent = 'Error loading company information.';
        }
    }
}

// Load data when page is ready
document.addEventListener('DOMContentLoaded', loadCompanyData);

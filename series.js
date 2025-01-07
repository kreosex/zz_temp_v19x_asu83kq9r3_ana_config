// TMDB API configuration
const TMDB_API_KEY_SERIES = '4e012d6a950f5501f23ee3e7f1e548d4'; // API anahtarınızı buraya ekleyin
const TMDB_BASE_URL_SERIES = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL_SERIES = 'https://image.tmdb.org/t/p';

currentPage = 1;
isLoading = false;
currentGenre = '';
currentYear = '';
currentSort = 'vote_count.desc';
searchQuery = '';

// DOM Elements
const seriesGrid = document.getElementById('seriesGrid');
const seriesSearch = document.getElementById('seriesSearch');
const genreFilter = document.getElementById('seriesGenreFilter');
const yearFilter = document.getElementById('seriesYearFilter');
const sortFilter = document.getElementById('seriesSortFilter');
const loadMoreButton = document.getElementById('loadMoreSeries');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadGenres();
    loadYears();
    loadSeries();
});

seriesSearch.addEventListener('input', debounce(() => {
    searchQuery = seriesSearch.value;
    resetAndReload();
}, 500));

genreFilter.addEventListener('change', () => {
    currentGenre = genreFilter.value;
    resetAndReload();
});

yearFilter.addEventListener('change', () => {
    currentYear = yearFilter.value;
    resetAndReload();
});

sortFilter.addEventListener('change', () => {
    currentSort = sortFilter.value;
    resetAndReload();
});

loadMoreButton.addEventListener('click', loadSeries);

// Functions
async function loadGenres() {
    try {
        const response = await fetch(`${TMDB_BASE_URL_SERIES}/genre/tv/list?api_key=${TMDB_API_KEY_SERIES}&language=tr-TR`);
        const data = await response.json();

        data.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Genre yüklenirken hata:', error);
    }
}

function loadYears() {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1990; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }
}

async function loadSeries() {
    if (isLoading) return;
    isLoading = true;

    try {
        let url;
        if (searchQuery) {
            url = `${TMDB_BASE_URL_SERIES}/search/tv?api_key=${TMDB_API_KEY_SERIES}&language=tr-TR&query=${searchQuery}&page=${currentPage}`;
        } else {
            url = `${TMDB_BASE_URL_SERIES}/discover/tv?api_key=${TMDB_API_KEY_SERIES}&language=tr-TR&sort_by=${currentSort}&page=${currentPage}`;

            if (currentGenre) url += `&with_genres=${currentGenre}`;
            if (currentYear) url += `&first_air_date_year=${currentYear}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (currentPage === 1) {
            seriesGrid.innerHTML = '';
        }

        data.results.forEach(series => {
            const seriesCard = createSeriesCard(series);
            seriesGrid.appendChild(seriesCard);
        });

        currentPage++;
        loadMoreButton.style.display = data.total_pages > currentPage ? 'block' : 'none';
    } catch (error) {
        console.error('Diziler yüklenirken hata:', error);
    } finally {
        isLoading = false;
    }
}

function createSeriesCard(series) {
    const card = document.createElement('div');
    card.className = 'series-card';

    const posterPath = series.poster_path
        ? `${TMDB_IMAGE_BASE_URL_SERIES}/w500${series.poster_path}`
        : 'https://via.placeholder.com/500x750?text=Poster+Bulunamadı';

    const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : 'N/A';

    card.innerHTML = `
        <img class="series-poster" src="${posterPath}" alt="${series.name}" 
             onerror="this.src='https://via.placeholder.com/500x750?text=Poster+Bulunamadı'">
        <div class="series-info">
            <h3 class="series-title">${series.name}</h3>
            <div class="series-meta">
                <div class="series-rating">
                    <i class="fas fa-star"></i>
                    <span>${series.vote_average ? series.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
                <span>${year}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => showSeriesDetails(series.id));

    return card;
}

// Show series details
async function showSeriesDetails(seriesId) {
    const popup = document.getElementById('seriesDetailPopup');
    const loading = popup.querySelector('.series-loading');

    popup.classList.add('show');
    document.body.classList.add('popup-open');
    loading.style.display = 'flex';

    try {
        const response = await fetch(
            `${TMDB_BASE_URL_SERIES}/tv/${seriesId}?api_key=${TMDB_API_KEY_SERIES}&language=tr-TR`
        );
        const series = await response.json();

        // Update popup content
        document.getElementById('seriesDetailTitle').textContent = series.name;
        document.getElementById('seriesDetailRating').textContent = series.vote_average.toFixed(1);
        document.getElementById('seriesDetailYear').textContent = new Date(series.first_air_date).getFullYear();
        document.getElementById('seriesDetailVotes').textContent = series.vote_count.toLocaleString();
        document.getElementById('seriesDetailOverview').textContent = series.overview || 'Açıklama bulunamadı';

        // Load images
        const backdropPath = series.backdrop_path || series.poster_path;
        const backdropUrl = backdropPath
            ? `${TMDB_IMAGE_BASE_URL_SERIES}/original${backdropPath}`
            : 'https://via.placeholder.com/1280x720?text=Görsel+Bulunamadı';

        const posterUrl = series.poster_path
            ? `${TMDB_IMAGE_BASE_URL_SERIES}/w500${series.poster_path}`
            : 'https://via.placeholder.com/500x750?text=Poster+Bulunamadı';

        document.getElementById('seriesBackdrop').src = backdropUrl;
        document.getElementById('seriesDetailPoster').src = posterUrl;

        // Load and display seasons
        const seasonList = document.querySelector('.season-list');
        seasonList.innerHTML = '';

        series.seasons.forEach(season => {
            const seasonCard = document.createElement('div');
            seasonCard.className = 'season-card';

            const seasonPosterUrl = season.poster_path
                ? `${TMDB_IMAGE_BASE_URL_SERIES}/w342${season.poster_path}`
                : 'https://via.placeholder.com/342x513?text=Poster+Bulunamadı';

            const airDate = season.air_date ? new Date(season.air_date).getFullYear() : 'Belirsiz';

            seasonCard.innerHTML = `
                <img class="season-poster" src="${seasonPosterUrl}" alt="${season.name}"
                     onerror="this.src='https://via.placeholder.com/342x513?text=Poster+Bulunamadı'">
                <div class="season-info">
                    <div class="season-title">${season.name}</div>
                    <div class="season-meta">
                        <div class="episode-count">
                            <i class="fas fa-film"></i>
                            <span>${season.episode_count} Bölüm</span>
                        </div>
                        <span class="air-date">${airDate}</span>
                    </div>
                </div>
            `;

            seasonList.appendChild(seasonCard);
        });

    } catch (error) {
        console.error('Dizi detayları yüklenirken hata:', error);
    } finally {
        loading.style.display = 'none';
    }
}

// Close series detail popup
function closeSeriesDetail() {
    const popup = document.getElementById('seriesDetailPopup');
    popup.classList.remove('show');
    document.body.classList.remove('popup-open');
}

function resetAndReload() {
    currentPage = 1;
    loadSeries();
}

// Utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 
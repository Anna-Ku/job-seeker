/**
 * Parameters 
 */
var jobs_board = document.getElementById('jobs_board');
var categories_dropdown = document.getElementById('categories_dropdown');
let navItems = document.querySelectorAll('li.nav-item a');

const base_url = "https://remotive.com/api/remote-jobs?limit=16";
const jobs_categories_url = "https://remotive.com/api/remote-jobs/categories";

// const base_url = 'api/remote_jobs.json';
// const jobs_categories_url = 'api/remote_jobs_categories.json';

let jobs = [];
let jobs_categories = [];
let jobs_by_categories = new Map();
let favoriteJobs = JSON.parse(localStorage.getItem("favoriteJobs")) || [];
let currentPage = localStorage.getItem("currentPage") || "jobs";


/**
 * Fetch job categories from API and display in dropdown list
 */
async function fetchRemoteJobsCategories(){
  try {
    const response = await fetch(jobs_categories_url);
    const data = await response.json();
    jobs_categories = data.jobs;
    getRemoteJobsCategories();
  } catch (error) {
    console.log("Failed fetchRemoteJobsCategories");
  }  
}

/**
 * Fetch open positions from API build 'All Jobs' board and calls function fetchRemoteJobsCategories()
 */
async function fetchRemoteJobs(){
  try {
    const response = await fetch(base_url);
    const data = await response.json();
    jobs = data.jobs;
    getRemoteJobs();
    fetchRemoteJobsCategories();
  } catch (error) {
      console.log("Failed fetchRemoteJobs");
  }
}

/**
 * This function fetch open positions by category name and calls function getRemoteJobs(category)
 * @param {string} category - category name.
 */
async function fetchRemoteJobsByCategory(category){
  try {
    console.log(`Fetching jobs from category=${category}`);
    const response = await fetch(`https://remotive.com/api/remote-jobs?category=${category}`);
    const data = await response.json();
    if (!jobs_by_categories.has(category)){
      jobs_by_categories.set(category, data.jobs);
    }
    getRemoteJobs(category);
    
  } catch (error) {
    console.log(error);
  }
}

/**
 * This function adds onclick event to all categories in dropdown
 */
function getRemoteJobsCategories(){
  jobs_categories.forEach((category) => {
    categories_dropdown.innerHTML += `
        <li><a class="dropdown-item" href="#") onclick='fetchRemoteJobsByCategory("${category.name}")'>${category.name}</a></li>
    `;
  });
}

/**
 * This function build open position board/saved jobs
 * @param {string} filter_by_category - by default is null, display all open positions.
 */
function getRemoteJobs(filter_by_category=null){
    jobs_board.innerHTML = '';    
    jobs_board.style.display = "flex";
    let array = document.getElementById('search-input').value ? getFilteredArray(filter_by_category) : getCurrentArray(filter_by_category);
    emptyFavorites();

    array.forEach((job) =>{
      const isFavorite = favoriteJobs.some((saved) => saved.id === job.id);
      const eventName = isFavorite ? "deleteFavoriteJob" : "saveFavoriteJob";
      var job_type = displayHelper("job_type", String(job.job_type));

      jobs_board.innerHTML += `
          <div class="card">
              <div class="company-logo-img"><img alt="Company Logo URL" src=${job.company_logo_url}/></div>
              <div class="job-title">${job.title}</div>
              <div class="company-name">${job.company_name}</div>
              <hr class="mt-1 mb-1"/>
              <div class="skills-container">
                <div class="skill"><strong>Job Type:</strong> ${job_type}, <strong>Salary:</strong> ${job.salary}</div>
                <div class="skill"><strong>Location:</strong> ${job.candidate_required_location}</div>
              </div>
              <div class="job-description">${job.description}</div>
              <button class="see" onclick="location.href='${job.url}';">See Job</button>
              <button onclick=${eventName}("${encodeURIComponent(JSON.stringify(job))}") class="save">${isFavorite ? "Delete" : "Save"}</button>                    
              <a href="#"></a>
          </div>  
      `
    });
}

/**
 * This function return current array.
 * @param {string} filter_by_category - if param is not null we get positions from  @param jobs_by_categories {map}.
 *                                      otherwise jobs/favoriteJobs
 */
function getCurrentArray(filter_by_category){
    if (filter_by_category != null)
       return jobs_by_categories.has(filter_by_category) ? jobs_by_categories.get(filter_by_category):fetchRemoteJobsByCategory(filter_by_category);
    return currentPage === "jobs" ? jobs : favoriteJobs;
}

/**
 * This functions check if display paragram 'EMPTY SECTION' .
 */
function emptyFavorites(){
  if (currentPage == "saved" && !favoriteJobs.length)
      document.getElementById('empty_favorites').style.display = "block";
  else 
    document.getElementById('empty_favorites').style.display = "none";
}

/**
 * This functions search for match based on search request (company name/ position title).
 */
function getFilteredArray(filter_by_category){
  let input_text = document.getElementById('search-input');
  let array = getCurrentArray(filter_by_category);
  let matchObjects = [];

  if (input_text.value){
      array.forEach((object) => {
        if (String(object.company_name).includes(input_text.value) || String(object.title).includes(input_text.value)) {
            matchObjects.push(object);
        }
      });
  }
  document.getElementById('search-input').value = '';
  return matchObjects;
}

function displayHelper(fieldType, fieldData){
  switch (fieldType) {
    case "job_type":
      return fieldData.replace('_', ' ');
    default:
      return fieldData;
  }
}


/**
 * This function receives job object that should save in Favorites.
 * @param {object} j - job object
 */
function saveFavoriteJob(j) {
  const job = JSON.parse(decodeURIComponent(j))
  favoriteJobs.push(job);
  localStorage.setItem("favoriteJobs", JSON.stringify(favoriteJobs));
  getRemoteJobs();
}

/**
 * This function receives job object that should deleted from Favorites.
 * @param {object} j - job object
 */
function deleteFavoriteJob(j) {
  const favoriteJob = JSON.parse(decodeURIComponent(j))
  const index = favoriteJobs.findIndex((job) => job.id === favoriteJob.id);
  favoriteJobs.splice(index, 1);
  localStorage.setItem("favoriteJobs", JSON.stringify(favoriteJobs));
  getRemoteJobs();
}

/**
 * This function checks which data represent based on page location.
 */
function setPage(page) {
  currentPage = page;
  localStorage.setItem("currentPage", currentPage);
  if (page === 'home'){
    document.getElementById('jobs_board').style.display = 'none';
    document.getElementById('empty_favorites').style.display = "none"
    document.getElementById('home').style.display = "block";  
  }
  else {
    document.getElementById('home').style.display = "none";  
    document.getElementById('empty_favorites').style.display = "none"
    getRemoteJobs();
  }
}

/**
 * This function adds event listener to nav items(hover).
 */
navItems.forEach((el) => {
  el.addEventListener('click',() => {
    if (!el.classList.contains('active')) {
      navItems.forEach((others) => {
          others.classList.remove('active');
      });
      el.classList.add('active');
    };
    
  });
});

/**
 * DISPLAY STARTS FROM HERE .
 */
fetchRemoteJobs();

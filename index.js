const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];

const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty();
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(numPages, startPage + maxVisiblePages - 1);

  // Adjust the startPage if we're at the end of the page range
  startPage = Math.max(1, endPage - maxVisiblePages + 1);

  // Previous button
  if (currentPage > 1) {
    $('#pagination').append(`<button class="btn btn-secondary mr-1" onclick="changePage(${currentPage - 1})">Previous</button>`);
  }

  for (let i = startPage; i <= endPage; i++) {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
    `);
  }

  // Next button
  if (currentPage < numPages) {
    $('#pagination').append(`<button class="btn btn-secondary ml-1" onclick="changePage(${currentPage + 1})">Next</button>`);
  }
};

const changePage = (page) => {
  currentPage = page;
  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
  updateInfoSection();
};

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  const selected_pokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  $('#pokeCards').empty();
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url);
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}>
        <h3>${res.data.name.toUpperCase()}</h3>
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>
    `);
  });
};

const setup = async () => {
  $('#pokeCards').empty();
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;

  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
  updateInfoSection();

  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName');
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const types = res.data.types.map((type) => type.type.name);
    $('.modal-body').html(`
        <div style="width:200px">
          <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
          <div>
            <h3>Abilities</h3>
            <ul>
              ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
            </ul>
          </div>
          <div>
            <h3>Stats</h3>
            <ul>
              ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
            </ul>
          </div>
        </div>
        <h3>Types</h3>
        <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
        </ul>
    `);
    $('.modal-title').html(`
      <h2>${res.data.name.toUpperCase()}</h2>
      <h5>${res.data.id}</h5>
    `);
  });

  $('body').on('click', ".numberedButtons", async function (e) {
    const page = Number($(this).val());
    changePage(page);
  });
};

const fetchTypes = async () => {
  const response = await axios.get('https://pokeapi.co/api/v2/type/');
  const types = response.data.results;
  $('#filterSection').append('<div><strong>Filter by Type:</strong></div>');
  types.forEach(type => {
    $('#filterSection').append(`<input type="checkbox" name="type" value="${type.name}" onchange="filterPokemons()"> ${type.name}<br>`);
  });
};

const filterPokemons = async () => {
  let selectedTypes = $('input[name="type"]:checked').map(function () {
    return this.value;
  }).get();

  if (selectedTypes.length > 0) {
    let filteredPokemons = [];
    for (let type of selectedTypes) {
      let response = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
      let pokemonsOfType = response.data.pokemon.map(p => p.pokemon);
      filteredPokemons = filteredPokemons.concat(pokemonsOfType);
    }
    pokemons = filteredPokemons;
  } else {
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    pokemons = response.data.results;
  }

  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
};

const updateInfoSection = () => {
  const totalPokemons = pokemons.length;
  const startNum = (currentPage - 1) * PAGE_SIZE + 1;
  const endNum = Math.min(currentPage * PAGE_SIZE, totalPokemons);
  $('#infoSection').html(`Showing ${startNum}-${endNum} of ${totalPokemons} pokemons`);
};

$(document).ready(() => {
  setup();
  fetchTypes();
});

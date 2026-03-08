function toggleSubGrid(id) {
  const el = document.getElementById(id);
  if (!el) return;
  document.querySelectorAll('.subcategory-grid').forEach(grid => {
    if (grid.id !== id) grid.classList.add('hidden');
  });
  el.classList.toggle('hidden');
}

async function search() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) {
    showError('Please enter a search term');
    return;
  }
  hideError();
  await searchRecipes(query);
}

async function searchRecipes(query) {
  const resultsDiv = document.getElementById('recipeResults');
  resultsDiv.innerHTML = '<div class="loading">Loading recipes and nutrition facts...</div>';
  try {
    const response = await fetch(`/api/recipes?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      resultsDiv.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No recipes found</p>';
      return;
    }

    resultsDiv.innerHTML = data.results.map(recipe => `
      <div class="card" onclick="showRecipeDetails(${recipe.id})">
        <img src="${recipe.image}" alt="${recipe.title}">
        <div class="card-content">
          <h3>${recipe.title}</h3>
          <div class="recipe-details">
            <p><strong>Ready in:</strong> ${recipe.readyInMinutes || 'N/A'} mins</p>
            <p><strong>Servings:</strong> ${recipe.servings || 'N/A'}</p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    showError('Error fetching recipes: ' + error.message);
  }
}

async function showRecipeDetails(recipeId) {
  try {
    const response = await fetch(`/api/recipe/${recipeId}`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const recipe = await response.json();

    document.getElementById('modalRecipeTitle').textContent = recipe.title;
    document.getElementById('modalRecipeImage').src = recipe.image;

    const nutritionGrid = document.getElementById('nutritionGrid');
    nutritionGrid.innerHTML = '';
    if (recipe.nutrition?.nutrients?.length) {
      recipe.nutrition.nutrients.slice(0, 12).forEach(nutrient => {
        const item = document.createElement('div');
        item.className = 'nutrition-item';
        item.innerHTML = `
          <div class="nutrition-label">${nutrient.name}</div>
          <div class="nutrition-value">${Math.round(nutrient.amount)}${nutrient.unit}</div>
        `;
        nutritionGrid.appendChild(item);
      });
    } else {
      nutritionGrid.innerHTML = '<p>No nutrition data available</p>';
    }

    const instrSection = document.getElementById('instructionsSection');
    instrSection.innerHTML = recipe.instructions
      ? `<h3 onclick="toggleSection('instructionsContent')" style="cursor:pointer; color:#667eea;">Instructions &#9654;</h3>
         <div id="instructionsContent" class="collapsible">${recipe.instructions.replace(/\n/g, '<br>')}</div>`
      : '';

    const ingrSection = document.getElementById('ingredientsSection');
    ingrSection.innerHTML = recipe.extendedIngredients?.length
      ? `<h3 onclick="toggleSection('ingredientsContent')" style="cursor:pointer; color:#667eea;">Ingredients &#9654;</h3>
         <ul id="ingredientsContent" class="collapsible">
           ${recipe.extendedIngredients.map(i => `<li>${i.original}</li>`).join('')}
         </ul>`
      : '';

    const srcSection = document.getElementById('sourceUrlSection');
    const link = recipe.sourceUrl || recipe.spoonacularSourceUrl;
    srcSection.innerHTML = link ? `<a href="${link}" target="_blank">View full recipe</a>` : '';

    document.getElementById('nutritionModal').style.display = 'block';
  } catch (error) {
    showError('Error fetching recipe details: ' + error.message);
  }
}

function closeNutritionModal() {
  document.getElementById('nutritionModal').style.display = 'none';
}

function toggleSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error').classList.add('hidden');
}

window.onclick = function(event) {
  const modal = document.getElementById('nutritionModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') search();
});
/**
 * @typedef {{
 *  name: string,
 *  id: string
 * }} RecipeIndexItem
 */

/**
 * @typedef {{
 *  recipes: RecipeIndexItem[]
 * }} RecipeIndex
 */

const recipes = document.getElementById('recipes')

fetchRecipeIndex().then(data => data.recipes.map(recipeIndexItem => {
    const recipeListItem = createRecipeListItemElement(recipeIndexItem)
    recipes.appendChild(recipeListItem)
}))

/**
 * @return {Promise<RecipeIndex>}
 */
function fetchRecipeIndex() {
    return fetch('/data/recipes')
        .then(response => response.json())
}

/**
 *
 * @param {RecipeIndexItem} recipeIndexItem
 * @return {HTMLLIElement}
 */
function createRecipeListItemElement(recipeIndexItem) {
    const anchor = document.createElement('a')

    anchor.href = `./recipes/?id=${recipeIndexItem.id}`
    anchor.innerText = recipeIndexItem.name

    const listItem = document.createElement('li')

    listItem.appendChild(anchor)

    return listItem
}

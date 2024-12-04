class Template {

    /**
     * @type {string}
     */
    #entity

    /**
     * @type {string}
     */
    #id

    constructor(entity, id) {
        this.#entity = entity
        this.#id = id
    }

    get entity() {
        return this.#entity
    }

    get id() {
        return this.#id
    }
}

class TemplateParser {
    #templateRegex = /\{\{(useIngredients|ingredients|useSupplies|supplies):[a-z\-]+}}/g

    /**
     * @type {string}
     * @return {Template}
     */
    parse(templateString) {
        const regex = new RegExp(this.#templateRegex)
        if (!regex.test(templateString)) {
            throw new Error(`Template parse requires template string '${templateString}'`)
        }

        const [entity, id] = templateString.replace('{{', '').replace('}}', '').split(':')

        return new Template(entity, id)
    }

    /**
     * @type {RegExp}
     */
    get templateRegex() {
        return this.#templateRegex;
    }
}

class Recipe {
    /**
     * @type {string}
     */
    #name

    /**
     * @type {Ingredient[]}
     */
    #ingredients = []

    /**
     * @type {Supply[]}
     */
    #supplies = []

    /**
     * @type {Step[]}
     */
    #steps = []

    /**
     * @param {string} name
     * @param {Ingredient[]} ingredients
     * @param {Supply[]} supplies
     * @param {Step[]} steps
     */
    constructor(name, ingredients, supplies, steps) {
        this.#name = name
        this.#ingredients = ingredients
        this.#supplies = supplies
        this.#steps = steps

        for (const step of this.#steps) {
            step.recipe = this
        }
    }

    get name() {
        return this.#name
    }


    get ingredients() {
        return this.#ingredients
    }

    get supplies() {
        return this.#supplies
    }

    get steps() {
        return this.#steps
    }

    getIngredientById(id) {
        for (const ingredient of this.#ingredients) {
            if (ingredient.id === id) {
                return ingredient
            }
        }
    }

    getSupplyById(id) {
        for (const supply of this.#supplies) {
            if (supply.id === id) {
                return supply
            }
        }
    }

    /**
     * @param {number} portions
     */
    set portions(portions) {
        for (const ingredient of this.#ingredients) {
            ingredient.portions = portions
        }
    }
}

class Ingredient {
    /**
     * @type {string}
     */
    #id

    /**
     * @type {string}
     */
    #name

    /**
     * @type {string}
     */
    #unit

    /**
     * @type {Use<Ingredient>[]}
     */
    #uses = []

    /**
     * @param {string} id
     * @param {string} name
     * @param {string} unit
     * @param {Use<Ingredient>[]} uses
     */
    constructor(id, name, unit, uses= []) {
        this.#id = id
        this.#name = name
        this.#unit = unit
        this.#uses = uses
    }


    get id() {
        return this.#id
    }

    get name() {
        return this.#name
    }

    get unit() {
        return this.#unit
    }

    /**
     * @return {number}
     */
    get totalAmount() {
        return this.#uses.reduce((previous, current) => previous + current.amount * current.portions, 0);
    }

    /**
     * @param {Use<Ingredient>} use
     */
    addUse(use) {
        this.#uses.push(use);
    }

    /**
     * @param {number} portions
     */
    set portions(portions) {
        for (const use of this.#uses) {
            use.portions = portions
        }
    }

    toString() {
        return this.#name
    }
}

class Step {
    /**
     * @type {string}
     */
    #name

    /**
     * @type {string}
     */
    #text


    /**
     * @type {Use<Ingredient>[]}
     */
    #useIngredients = []

    /**
     * @type {Use<Supply>[]}
     */
    #useSupplies = []

    /**
     * @type {Recipe}
     */
    #recipe

    /**
     * @param {string} name
     * @param {string} text
     * @param {Use<Ingredient>[]} useIngredients
     * @param {Use<Supply>[]} useSupplies
     */
    constructor(name, text, useIngredients, useSupplies) {
        this.#name = name
        this.#text = text
        this.#useIngredients = useIngredients
        this.#useSupplies = useSupplies
    }

    /**
     * @return {(string | Ingredient | Use<Ingredient> | Supply | Use<Supply>)[]}
     */
    get text() {
        /**
         *
         * @type {(string | Ingredient | Use<Ingredient> | Supply | Use<Supply>)[]}
         */
        const text = []
        const templateParser = new TemplateParser()

        const regExpExecArrays = this.#text.matchAll(templateParser.templateRegex)

        let lastEndIndex = 0

        for (const regExpExecArray of regExpExecArrays) {
            const templateString = regExpExecArray[0]
            const currentStartIndex = regExpExecArray.index

            text.push(this.#text.substring(lastEndIndex, currentStartIndex))

            lastEndIndex = currentStartIndex + templateString.length

            const template = templateParser.parse(templateString)

            if (template.entity === 'ingredients') {
                text.push(this.#recipe.getIngredientById(template.id))
            } else if (template.entity === 'useIngredients') {
                text.push(this.#getUseIngredientById(template.id))
            } else if (template.entity === 'useSupplies') {
                text.push(this.#getUseSupplyById(template.id))
            } else if (template.entity === 'supplies') {
                text.push(this.#recipe.getSupplyById(template.id))
            }

        }

        text.push(this.#text.substring(lastEndIndex, this.#text.length))

        return text
    }

    get name() {
        return this.#name
    }

    /**
     * @param {Recipe} value
     */
    set recipe(value) {
        this.#recipe = value;
    }

    #getUseIngredientById(id) {
        for (const useIngredient of this.#useIngredients) {
            if (useIngredient.belongsTo.id === id) {
                return useIngredient
            }
        }
    }

    #getUseSupplyById(id) {
        for (const useSupply of this.#useIngredients) {
            if (useSupply.belongsTo.id === id) {
                return useSupply
            }
        }
    }
}

class Supply {
    /**
     * @type {string}
     */
    #id

    /**
     * @type {string}
     */
    #name

    /**
     * @type {Use[]}
     */
    #uses = []

    /**
     * @param {string} id
     * @param {string} name
     * @param {Use<Supply>[]} uses
     */
    constructor(id, name, uses= []) {
        this.#id = id;
        this.#name = name;
        this.#uses = uses;
    }


    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    /**
     * @param {Use<Supply>} use
     */
    addUse(use) {
        this.#uses.push(use)
    }

    toString() {
        return this.#name
    }
}

/**
 * @template TBelongsTo
 */
class Use {
    /**
     * @type {number}
     */
    #amount

    /**
     * @type {TBelongsTo}
     */
    #belongsTo

    /**
     * @type {number}
     */
    portions

    /**
     * @param {number} amount
     * @param {TBelongsTo} belongsTo
     * @param {number} portions
     */
    constructor(amount, belongsTo, portions = 1) {
        this.#amount = amount
        this.#belongsTo = belongsTo
        this.portions = portions
    }

    get amount() {
        return this.#amount
    }

    get belongsTo() {
        return this.#belongsTo
    }

    toString() {
        return `${this.#amount * this.portions} ${this.#belongsTo.unit} ${this.#belongsTo.name}`
    }
}

class RecipeFactory {
    /**
     * @type {StepFactory}
     */
    #stepFactory

    constructor (stepFactory) {
        this.#stepFactory = stepFactory
    }

    /**
     * @param {RecipeData} recipeData
     * @param {number} portions
     * @return {Recipe}
     */
    create(recipeData, portions) {
        const name = recipeData.name

        const ingredients = recipeData.ingredients.map(({ id, name, unit }) => new Ingredient(id, name, unit))
        const ingredientRecord = this.#toRecord(ingredients, (ingredient) => ingredient.id)

        const supplies = recipeData.supplies.map(({ id, name}) => new Supply(id, name))
        const supplyRecord = this.#toRecord(supplies, (supply) => supply.id)

        const steps = recipeData.steps.map((stepData) => this.#stepFactory.create(stepData, ingredientRecord, supplyRecord))

        const recipe = new Recipe(name, ingredients, supplies, steps)

        recipe.portions = portions

        return recipe
    }

    /**
     * @template T
     * @param {T[]} array
     * @param {function(T): string} getKey
     * @return {Record<string, T>}
     */
    #toRecord(array, getKey) {
        return array.reduce((previous, current) => {
            previous[getKey(current)] = current;
            return previous;
        }, {})
    }
}

class StepFactory {

    /**
     * @param {StepData} stepData
     * @param {Record<string, Ingredient>} ingredientRecord
     * @param {Record<string, Supply>} supplyRecord
     * @return {Step}
     */
    create(stepData, ingredientRecord, supplyRecord) {
        /**
         * @type {Use<Ingredient>[]}
         */
        const useIngredients = []

        if (stepData.useIngredients) {
            for (const { belongsToId, amount } of stepData.useIngredients) {
                const ingredient = ingredientRecord[belongsToId]
                if (ingredient) {
                    /**
                     * @type {Use<Ingredient>}
                     */
                    const useIngredient = new Use(amount, ingredient)

                    ingredient.addUse(useIngredient)

                    useIngredients.push(useIngredient)
                }
            }
        }

        /**
         * @type {Use<Supply>[]}
         */
        const useSupplies = []

        if (stepData.useSupplies) {
            for (const { belongsToId, amount } of stepData.useSupplies) {
                const supply = supplyRecord[belongsToId]
                if (supply) {
                    /**
                     * @type {Use<Supply>}
                     */
                    const useSupply = new Use(amount, supply)

                    supply.addUse(useSupply)

                    useSupplies.push(useSupply)
                }
            }
        }

        return new Step(stepData.name, stepData.text, useIngredients, useSupplies)
    }
}

/**
 * @typedef {{
 *     name: string,
 *     ingredients: IngredientData[],
 *     supplies: SupplyData[],
 *     steps: StepData[],
 * }} RecipeData
 */

/**
 * @typedef {{
 *     useIngredients?: UseData[]
 *     useSupplies?: UseData[]
 *     name: string,
 *     text: string
 * }} StepData
 */

/**
 * @typedef {{
 *     id: string,
 *     name: string
 * }} SupplyData
 */

/**
 * @typedef {{
 *     id: string,
 *     name: string,
 *     unit: string
 * }} IngredientData
 */

/**
 * @typedef {{
 *     belongsToId: string,
 *     amount: number
 * }} UseData
 */

const defaultPortions = 1

/**
 * @type {Recipe}
 */
const notFound = new Recipe('Recept niet gevonden', [], [], [])

const searchParams = new URLSearchParams(window.location.search)

const queryParamsId = searchParams.get('id')

const queryParamsPortions = parseInt(searchParams.get('portions'))

/**
 * @type {HTMLInputElement}
 */
const portionsElement = document.getElementById('portions')

const nameElement = document.getElementById('name')

const suppliesElement = document.getElementById('supplies')

const stepsElement = document.getElementById('steps')

const ingredientsElement = document.getElementById('ingredients')

const initialPortions = queryParamsPortions && !isNaN(queryParamsPortions) ?
    queryParamsPortions :
    defaultPortions

portionsElement.value = initialPortions.toString()

const recipeFactory = new RecipeFactory(new StepFactory())

fetchRecipe(queryParamsId)
    .then(recipeData => {
        const recipe = recipeFactory.create(recipeData, initialPortions)
        setRecipe(recipe)
        portionsElement.onchange = (event) => {
            const portions = parseInt(event.target.value)

            if (isNaN(portions)) {
                return
            }

            searchParams.set('portions', portions.toString())
            
            if (portions === defaultPortions) {
                searchParams.delete('portions')
            }

            history.replaceState(
                null,
                null,
                `${window.location.origin}${window.location.pathname}?${searchParams.toString()}`)

            recipe.portions = portions

            setRecipe(recipe)
        }
    })
    .catch(() => setRecipe(notFound))

/**
 * @param {Recipe} recipe
 * @return {void}
 */
function setRecipe(recipe) {
    suppliesElement.innerHTML = ''
    ingredientsElement.innerHTML = ''
    stepsElement.innerHTML = ''

    document.title = `Rizzipes - ${recipe.name}`
    nameElement.innerText = recipe.name

    recipe.supplies.map(supply => suppliesElement.appendChild(createListItemElementWithInnerText(supply.name)))

    recipe.ingredients.map(ingredient => ingredientsElement.appendChild(createListItemElementWithInnerText(formatIngredient(ingredient))))

    recipe.steps.map((step, index) => stepsElement.appendChild(createStepSection(step, index + 1)))
}

/**
 * @param {Ingredient} ingredient
 * @return {string}
 */
function formatIngredient(ingredient) {
    return `${ingredient.totalAmount} ${ingredient.unit} ${ingredient.name}`
}

/**
 * @param {string} id
 * @return {Promise<RecipeData>}
 */
function fetchRecipe(id) {
    return fetch(`/data/recipes/${id}.json`)
        .then(response => response.json())
}

/**
 *
 * @param {string} innerText
 * @return {HTMLLIElement}
 */
function createListItemElementWithInnerText(innerText) {
    const listItem = document.createElement('li')

    listItem.innerText = innerText

    return listItem
}

/**
 * @param {Step} step
 * @param {number} index
 * @return {HTMLElement}
 */
function createStepSection(step, index) {
    const section = document.createElement('section')

    const header = document.createElement('h4')

    const paragraph = document.createElement('p')

    header.innerText = `${index}: ${step.name}`

    for (const textItem of step.text) {
        if (typeof textItem === 'string') {
            paragraph.append(textItem)
            continue
        }

        const underscore = document.createElement('u')

        underscore.innerText = textItem.toString()

        paragraph.append(underscore)
    }

    section.appendChild(header)
    section.appendChild(paragraph)

    return section
}

import { GetBaseUoM, GetProductsForIngredient } from "./supporting-files/data-access";
import { ConvertUnits, GetCostPerBaseUnit, GetNutrientFactInBaseUnits } from "./supporting-files/helpers";
import { Product, Recipe, RecipeLineItem, NutrientFact, UnitOfMeasure } from "./supporting-files/models";

/**
 * Finds the product with the lowest cost for a given recipe line item.
 * @param lineItem - The recipe line item to find the lowest cost product for.
 * @returns - The product with the lowest cost and the cost of that product.
 */
function findLowestCostProduct(lineItem: RecipeLineItem): { product: Product; cost: number } {
    const products = GetProductsForIngredient(lineItem.ingredient);
    let lowestCostProduct: Product | null = null;
    let lowestCost = Infinity;

    for (const product of products) {
        for (const supplierProduct of product.supplierProducts) {
            const baseCost = GetCostPerBaseUnit(supplierProduct);
            const realCost = calculateRealCost(lineItem.unitOfMeasure, baseCost);

            if (realCost < lowestCost) {
                lowestCost = realCost;
                lowestCostProduct = product;
            }
        }
    }

    if (!lowestCostProduct) {
        throw new Error("No products available for the given ingredient.");
    }

    return { product: lowestCostProduct, cost: lowestCost };
}

/**
 * Calculates the total cost of a product based on its price and unit of measure.
 * @param price - The price of the product.
 * @param supplierUoM - The unit of measure of the supplier product.
 * @param lineItemUoM - The unit of measure of the line item.
 * @returns - The total cost for the given quantity.
 */
function calculateRealCost(realUoM: UnitOfMeasure, basePrice: number): number {
    const baseUnitOfMeasure = GetBaseUoM(realUoM.uomType);
    const convertedUoM = ConvertUnits(realUoM, baseUnitOfMeasure.uomName, baseUnitOfMeasure.uomType);
    return basePrice * convertedUoM.uomAmount;
}

/**
 * Aggregates nutrient facts from a new list into an existing list.
 * @param existingNutrientFacts - The current list of nutrient facts.
 * @param newNutrientFacts - The new nutrient facts to aggregate.
 */
function aggregateNutrients(existingNutrientFacts: { [key: string]: NutrientFact }, newNutrientFacts: NutrientFact[]): void {
    newNutrientFacts.forEach(fact => {
        const baseUnitFact = GetNutrientFactInBaseUnits(fact);
        if (existingNutrientFacts[fact.nutrientName]) {
            existingNutrientFacts[fact.nutrientName].quantityAmount.uomAmount += baseUnitFact.quantityAmount.uomAmount;
        } else {
            existingNutrientFacts[fact.nutrientName] = baseUnitFact;
        }
    });
}

/**
 * Sorts the keys of an object alphabetically and returns a new object.
 * @param object - The object whose keys need to be sorted.
 * @returns - A new object with keys sorted alphabetically.
 */
function sortKeys(object: { [key: string]: any }): { [key: string]: any } {
    return Object.keys(object)
        .sort()
        .reduce((result: { [key: string]: any }, key: string) => {
            result[key] = object[key];
            return result;
        }, {});
}

/**
 * Calculates a summary of a recipe, including the lowest possible cost and aggregated nutrient facts.
 * @param recipe - The recipe to summarize.
 * @returns - The total cost and aggregated nutrient facts for the recipe.
 */
function summarizeRecipe(recipe: Recipe): { cheapestCost: number; nutrientsAtCheapestCost: { [key: string]: NutrientFact } } {
    let totalCost = 0;
    const totalNutrients: { [key: string]: NutrientFact } = {};

    recipe.lineItems.forEach(lineItem => {
        const { product, cost } = findLowestCostProduct(lineItem);
        totalCost += cost;

        aggregateNutrients(totalNutrients, product.nutrientFacts);
    });

    return { cheapestCost: totalCost, nutrientsAtCheapestCost: sortKeys(totalNutrients) };
}

export { summarizeRecipe };

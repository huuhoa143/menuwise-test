import { GetRecipes } from "./supporting-files/data-access";
import { ExpectedRecipeSummary, RunTest } from "./supporting-files/testing";
import {summarizeRecipe} from "./utils";

console.clear();
console.log("Expected Result Is:", ExpectedRecipeSummary);

const recipeData = GetRecipes(); // the list of 1 recipe you should calculate the information for
console.log("Recipe Data:", recipeData);
const recipeSummary: any = {}; // the final result to pass into the test function
/*
 * YOUR CODE GOES BELOW THIS, DO NOT MODIFY ABOVE
 * (You can add more imports if needed)
 * */

for (const recipe of recipeData) {
    recipeSummary[recipe.recipeName] = summarizeRecipe(recipe);
}
/*
 * YOUR CODE ABOVE THIS, DO NOT MODIFY BELOW
 * */
RunTest(recipeSummary);

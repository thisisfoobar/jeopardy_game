// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];
const count = 100;
const baseURL = "http://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  let results = await axios.get(`${baseURL}categories`, {
    params: { count },
  });
  let catIds = results.data.map((cat) => cat.id);
  return _.sampleSize(catIds, NUM_CATEGORIES);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  const showing = null;
  const response = await axios.get(`${baseURL}/category`, {
    params: { id: catId },
  });
  const title = response.data.title;
  const allClues = response.data.clues;
  const randClues = _.sampleSize(allClues, NUM_CLUES_PER_CAT);
  const clues = randClues.map((clue) => ({
    question: clue.question,
    answer: clue.answer,
    showing: null,
  }));

  return { title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  // populate table header row
  let $tr = $("<tr>");
  $("#jeopardy thead").empty();

  for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
    $tr.append($("<th>").text(categories[catIdx].title));
  }
  $("#jeopardy thead").append($tr);

  // populate table body
  $("#jeopardy tbody").empty();

  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    let $tr = $("<tr>");
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
      $tr.append($("<td>").attr("id", `${catIdx}-${clueIdx}`).text("?"));
    }
    $("#jeopardy tbody").append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  let id = evt.target.id;
  let [catID, clueID] = id.split("-");
  let clue = categories[catID].clues[clueID];
  let msg;

  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
  } else {
    return;
  }
  console.log(id, msg);
  $(`#${id}`).text(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

async function showLoadingView() {
  $("#jeopardy thead").empty();
  $("#jeopardy tbody").empty();
  $("#spin-container").toggle();
  await setupAndStart();
  hideLoadingView();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#spin-container").toggle();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  categories = [];

  const categoryIds = await getCategoryIds();
  for (let catId of categoryIds) {
    categories.push(await getCategory(catId));
  }
  fillTable();
}

/** On click of start / restart button, set up game. */

$("#start").on("click", showLoadingView);

/** On page load, add event handler for clicking clues */

$(async function () {
  await setupAndStart();
  $("#jeopardy").on("click", "td", handleClick);
});

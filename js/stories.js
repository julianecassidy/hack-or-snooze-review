// This is the global list of all stories (an instance of StoryList)
import {
  $allStoriesList,
  $storiesLoadingMsg,
  $storyForm
} from "./dom";
import { hidePageComponents } from "./main";
import { Story, StoryList } from "./models";
import { currentUser } from "./user";

export let currStoryList;

/******************************************************************************
 * Generating HTML for a story
 *****************************************************************************/

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns DOM object for the story.
 */

export function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // if a user is logged in, show favorite/not-favorite star
  const isLoggedIn = Boolean(currentUser);
  const $li = document.createElement("li");
  $li.id = story.storyId;
  $li.classList.add("Story", "mt-2");


  let isFav;
  if (isLoggedIn) {
    if (currentUser.favorites.some(s => s.storyId === story.storyId)) {
      isFav = "-fill";
    } else {
      isFav = "";
    }
  }

  $li.innerHTML = `
      ${isLoggedIn ? `<i class="bi bi-rocket-takeoff${isFav}"></i>` : ""}
      <a href="${story.url}" target="a_blank" class="Story-link">
        ${story.title}
      </a>
      <small class="Story-hostname text-muted">(${hostName})</small>
      <small class="Story-author">by ${story.author}</small>
      <small class="Story-user d-block">posted by ${story.username}</small>
    `;
  return $li;
}


/******************************************************************************
 * List all stories
 *****************************************************************************/

/** For in-memory list of stories, generates markup & put on page. */

export function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.innerHTML = "";

  for (const story of currStoryList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.classList.remove("d-none");

}
/******************************************************************************
 * List favorite stories
 *****************************************************************************/

/** For in-memory list of favorites, generates markup & put on page. */

export function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");

  $allStoriesList.innerHTML = "";

  for (const story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.classList.remove("d-none");
}


/******************************************************************************
 * Start: show stories
 *****************************************************************************/

/** Get and show stories when site first loads. */

export async function fetchAndShowStoriesOnStart() {
  currStoryList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/******************************************************************************
 * Form: add stories
 *****************************************************************************/


export async function addStory(evt) {
  console.debug("addStory", evt);
  evt.preventDefault();

  const qs = $storyForm.querySelector.bind($storyForm);
  const $failMsg = qs("#StoryForm-fail");
  $failMsg.classList.add("d-none");

  const title = qs("#StoryForm-title").value;
  const author = qs("#StoryForm-author").value;
  const url = qs("#StoryForm-url").value;

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  let story;
  try {
    story = await currStoryList.addStory(currentUser, { title, author, url });
  } catch (err) {
    $failMsg.classList.remove("d-none");
    $failMsg.innerHTML = err.message;
    console.error(evt);
    return;
  }

  $storyForm.reset();

  hidePageComponents();
  const $storyHTML = generateStoryMarkup(story);
  $allStoriesList.prepend($storyHTML);
  $allStoriesList.classList.remove("d-none");
}

$storyForm.addEventListener("submit", addStory);
import {
  $loginForm,
  $signupForm,
  $allStoriesList,
} from "./dom";

import { fetchAndShowStoriesOnStart, currStoryList } from "./stories";
import {
  checkForRememberedUser,
  currentUser,
  updateUIOnUserLogin,
} from "./user";

import { Story } from "./models";

/** To make it easier for individual components to show just themselves, this
 * is a useful function that hides pretty much everything on the page. After
 * calling this, individual components can re-show just what they want.
 */

export function hidePageComponents() {
  const components = [
    $allStoriesList,
    $loginForm,
    $signupForm,
  ];
  for (const $c of components) $c.classList.add("d-none");
}

/** Overall function to kick off the app. */
let newStory;
export async function start() {
  console.debug("start");

  // "Remember logged-in user" and log in, if credentials in localStorage
  await checkForRememberedUser();
  await fetchAndShowStoriesOnStart();
  console.log("currentUser", currentUser);
  newStory = await currStoryList.addStory(currentUser,
    {title: "Test", author: "Me", url: "http://meow.com"});
  console.log(newStory instanceof Story, "sarahs label")
  // if we got a logged-in user
  if (currentUser) await updateUIOnUserLogin();
}

// Once the DOM is entirely loaded, begin the app

console.warn(
  "HEY STUDENT: This program sends many debug messages to" +
    " the console. If you don't see the message 'start' below this, you're not" +
    " seeing those helpful debug messages. In your browser console, click on" +
    " menu 'Default Levels' and add Verbose",
);


const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

class Story {
  /** Make instance of Story from data object about story:
   *   - {storyId, title, author, url, username, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.updatedAt = "";
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Static method to fetch a story from the API.
   *
   * Accepts:
   *  - storyId: string
   *
   * Returns: new Story instance of the fetched story.
   */
  static async getStory(storyId) {
    const response = await fetch(`${BASE_URL}/stories/${storyId}`);
    const data = await response.json();
    const storyData = data.story;
    return new Story(storyData);
  }

  /** Parses hostname out of URL and returns it.
   *
   * http://foo.com/bar => foo.com
   *
   */

  getHostName() {
    return new URL(this.url).hostname;
  }

    /** Fetch a single story by id from the API. */
  static async getStory(id) {

    const response = await fetch(`${BASE_URL}/stories/${id}`);
    const data = await response.json();

    if (!response.ok) {
      console.error("story not found");
      return null;
    }

    const formattedStory = {
      storyId: data.story.storyId,
      title: data.story.title,
      author: data.story.author,
      url: data.story.url,
      username: data.story.username,
      createdAt: data.story.createdAt
    }

    const storyInstance = new Story(formattedStory)

    return storyInstance;
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 *****************************************************************************/

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await fetch(`${BASE_URL}/stories`);
    const data = await response.json();

    // turn plain old story objects from API into instances of Story class
    const stories = data.stories.map((s) => new Story(s));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Send story data to API, make a Story instance, and add it as the first
   * item to this StoryList.
   *
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, story) {
    const { title, author, url } = story;

    const response = await fetch(`${BASE_URL}/stories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "token": user.loginToken,
        "story": {
          "author": author,
          "title": title,
          "url": url,
        }
      })
    });
    const data = await response.json();
    const newStory = data.story;

    const formattedStory = {
      storyId: newStory.storyId,
      title: newStory.title,
      author: newStory.author,
      url: newStory.url,
      username: newStory.username,
      createdAt: newStory.createdAt
    }

    const storyInstance = new Story(formattedStory)

    this.stories.unshift(storyInstance);

    return storyInstance;
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 *****************************************************************************/

class User {
  constructor(
    {
      username,
      name,
      createdAt,
      favorites = [],
      ownStories = [],
    },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // store login token on the user so that it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const body = JSON.stringify({ user: { username, password, name } });
    const resp = await fetch(`${BASE_URL}/signup`, { method: "POST", body });
    if (!resp.ok) {
      throw new Error("Signup failed");
    }
    const data = await resp.json();
    const { user, token } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }

  /** Login in user with API, make User instance & return it.


     * - username: an existing user's username
     * - password: an existing user's password
     */

  static async login(username, password) {
    const body = JSON.stringify({ user: { username, password } });
    const resp = await fetch(`${BASE_URL}/login`, { method: "POST", body });
    if (!resp.ok) throw new Error("Login failed");
    const data = await resp.json();
    const { user, token } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   *   Returns new user (or null if login failed).
   */

  static async loginViaStoredCredentials(token, username) {
    const qs = new URLSearchParams({ token });
    const response = await fetch(`${BASE_URL}/users/${username}?${qs}`);
    if (!response.ok) {
      console.error("loginViaStoredCredentials failed");
      return null;
    }
    const data = await response.json();
    const { user } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }

  /** Takes a given story and makes it a favorite on the API
   * and adds it to the user instance's favorites.
   */
  async addFavorite(story) {
    const response = await fetch(
      `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "token": this.loginToken,
      })
    });
    const data = await response.json();

    if (!response.ok) {
      console.error("favorite not added");
      return null;
    }

    this.favorites.unshift(story);
  }

    /** Takes a given story and and makes it removes it as
     * favorite on the API and removes it from the user instance's favorites.
   */
    async removeFavorite(story) {
      const response = await fetch(
        `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "token": this.loginToken,
        })
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("favorite not removed");
        return null;
      }

      this.favorites = this.favorites.filter(s => s.storyId !== story.storyId);
    }
}

export { Story, StoryList, User, BASE_URL };

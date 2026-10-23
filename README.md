# Word Quest

A gentle, kid-friendly spelling game built with Rails 8 and Stimulus. Complete
missing-letter puzzles using picture clues, a letter bank, or your keyboard.

## Play

- **Little sprout:** six-letter words (like rabbit and turtle), with one missing letter.
- **Word explorer:** seven- to eight-letter words (like giraffe and sandwich), with two missing letters.
- **Word wizard:** tricky words with three missing letters.
- **Word scholar (Grade 4):** advanced eight- to twelve-letter words, such as
  beautiful, necessary, knowledge, and experiment, with four missing letters.
  Practice tricky vowels, silent letters, and doubled consonants with definition clues.
- Complete five randomly selected words to finish an adventure.
- Use a hint to fill one letter. Earn two stars for an unassisted word or one
  star with hints. Incorrect guesses never cost stars.
- Click a blank to edit it; type letters, Backspace to erase, and Enter to check.
- Optional browser speech reads completed words aloud.
- Grow a daily word garden from seed to smiling flower with each of your first
  five words. Solved words pop onto the trail with a confetti celebration;
  finishing an adventure earns a bigger celebration. Hints still help the garden grow.
  Animations respect the device's reduced-motion setting.

Daily goals, total words, stars, and consecutive-day streaks are saved locally
in the current browser, with no account or personal information required. The
daily goal resets at local midnight (refreshed on the next word or page load).
Switching difficulty starts a new trail but preserves earned progress.

## Development

Requires Ruby 3.4.5 and Bundler.
JSON is pinned to 2.x for Rails 8.0 cookie-serialization compatibility.

```sh
bundle install
bin/rails db:prepare
bin/rails server
```

Open http://localhost:3000. No JavaScript build step is required.

```sh
bin/rails test
bin/rails test:system
bin/rubocop
```

System tests require Chrome/Chromium and a compatible ChromeDriver.

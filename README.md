# Word Quest and Math Quest

A gentle, kid-friendly spelling game built with Rails 8 and Stimulus. Complete
missing-letter puzzles using picture clues, a letter bank, or your keyboard.
The landing page at `/` links to Word Quest at `/word-quest` and Math Quest at
`/math-quest`. Each game has its own saved progress.

## Math Quest

Six levels offer progressively more challenging number practice:

1. **Number sprout:** addition and non-negative subtraction within 20.
2. **Number explorer:** addition and non-negative subtraction within 100,
   with at least one number or result greater than 20.
3. **Multiplication magic:** multiplication facts from 1 to 12.
4. **Division detective:** exact division based on the 1-to-12 multiplication
   facts, with whole-number answers and no zero divisors.
5. **Operation expert:** mixed operations, including parentheses and order of
   operations. All results are non-negative whole numbers.
6. **Equation mastermind:** missing-number addition, subtraction, multiplication,
   and division equations.

Each adventure draws ten distinct questions from locally generated question
banks in [math_questions.js](app/javascript/data/math_questions.js). Enter an
answer and press Enter or Check my answer. Incorrect answers stay on the same
question without losing stars. Hints explain a strategy instead of filling the
answer; earn one star with a hint or two without. After ten correct answers,
the game suggests the next level without changing it automatically.

The adventure goal resets when replaying, changing level, or reloading. Total
math questions solved and stars are saved locally under
`math-quest-progress-v1`, separate from `word-quest-progress-v1`.
Storage errors are shown to the player. There are no timers, accounts, or
external question APIs.

## Word Quest

- **Little sprout:** six-letter words (like rabbit and turtle), with one missing letter.
- **Word explorer:** seven- to eight-letter words (like giraffe and sandwich), with two missing letters.
- **Word wizard:** tricky words with three missing letters.
- **Word scholar (Grade 4):** advanced eight- to twelve-letter words, such as
  beautiful, necessary, knowledge, and experiment, with four missing letters.
  Practice tricky vowels, silent letters, and doubled consonants with definition clues.
- **Mastermind:** words of five to ten letters, with exactly two randomly
  positioned letters revealed at the start. Fill every other position.
  Examples include ocean, lightning, friendship, and dictionary.
  On desktop, words stay on one horizontally scrollable line,
  automatically following the active blank. On smaller screens, words wrap.
  Letter banks wrap on all screens.
  Letter choices can be reused, and hints still fill one missing letter at a time.
- Complete ten randomly selected words without repeats to finish an adventure.
  A completion message suggests the next level without switching automatically.
  Word jumble celebrates completing the highest level instead.
- **Word jumble:** follows Mastermind and uses the same five- to ten-letter
  vocabulary, with every letter provided as a scrambled tile and no letters
  revealed. Tap tiles to fill the word in order; tap a filled space to return
  its tile. Each tile can be used once, including separate tiles for repeated
  letters. Typing uses available tiles and Backspace returns them. A hint
  moves a matching tile into the first incorrect space, returning or moving
  previously placed tiles as needed. Clues, stars, and adventure progress still apply.
- Use a hint to fill one letter. Earn two stars for an unassisted word or one
  star with hints. Incorrect guesses never cost stars.
- Click a blank to edit it; type letters, Backspace to erase, and Enter to check.
- Optional browser speech reads completed words aloud.
- Grow your adventure word garden from seed to smiling flower over its
  ten words, with a new growth stage every two words. Solved words pop onto the trail with a confetti celebration;
  finishing an adventure earns a bigger celebration. Hints still help the garden grow.
  Animations respect the device's reduced-motion setting.

Total words, stars, and consecutive-day streaks are saved locally in the current
browser, with no account or personal information required. The goal card and
garden track only successful words in the current adventure, matching the trail.
Replaying, switching difficulty, or reloading the page starts a fresh adventure
at 0/10 but preserves earned stars, total words, and daily history for streaks.

## Vocabulary

Game vocabulary lives in [game_words.js](app/javascript/data/game_words.js),
separate from the gameplay controller. The original words are preserved.
Little sprout and Word explorer each now contain 40 entries, including 30 new
words per level selected from the New Dolch List 1.1.
Word wizard and Word scholar each contain 30 entries; Mastermind and Word jumble
share a bank of 31 entries. These harder banks include 20 additional words each,
with original clues and emoji selections, covering animals, food, everyday
vocabulary, and science. Word wizard uses seven- to ten-letter words, Word scholar
uses eight to twelve, and Mastermind/Word jumble use five to ten. The Word scholar
selection practices spelling patterns rather than claiming curriculum certification.
All puzzle data is bundled locally; playing does not call an external word API.

The official [New Dolch List](https://www.newgeneralservicelist.com/new-dolch-list)
by Charles Browne and Brent Culligan contains 874 words in the downloaded
version 1.1, despite the website's general description of 875. The unmodified
[source CSV](vendor/data/new_dolch/words.csv) is retained for future review.
It has 120 lowercase six-letter candidates and 107 seven- or eight-letter
candidates. Not every candidate is enabled: length alone does not establish
spelling difficulty or suitability for a picture-clue puzzle.

The [approved adaptation](app/javascript/data/new_dolch_words.js) includes
original child-friendly clues and emoji selections, and is distributed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), like its source.
See the [attribution and modification notice](vendor/data/new_dolch/NOTICE.txt)
and [license text](vendor/data/new_dolch/LICENSE.txt).
Players can also see attribution in How to play.

To add more source words, review candidates in the CSV, add a unique
`[word, emoji, clue]` entry to the appropriate array in the approved adaptation,
and retain the license notice. Use lowercase `a`-`z` words: exactly six letters
for Little sprout and seven or eight for Word explorer. Review the meaning,
clue, and spelling difficulty before enabling a word. The list targets young
English-language learners and does not certify US grade-level placement.
Run the spelling-game system tests after vocabulary changes.

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

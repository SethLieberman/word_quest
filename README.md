# Quest Club

A gentle, kid-friendly spelling game built with Rails 8 and Stimulus. Complete
missing-letter puzzles using picture clues, a letter bank, or your keyboard.
The landing page at `/` links to Word Quest at `/word-quest`, Math Quest at
`/math-quest`, Read Aloud at `/read-aloud`, Trivia at `/trivia`,
Spot the Difference at `/spot-the-difference`, and Code Breakers at `/code-breakers`.
Read Aloud is also available in both game navigation menus. Word Quest,
Math Quest, and Trivia have separate saved progress.

## Fleet Quest

Fleet Quest is temporarily hidden from the landing page until persistent
database hosting is configured and multiplayer is verified on Heroku.
Its code and direct `/fleet-quest` routes remain available; hiding the card
does not disable existing room or invitation links.

A private, two-player ship-finding game without accounts, names, chat, or a
public room list. Create a game, send its invitation link to one trusted friend,
and keep your room page. The invitation previews the room; **Join game** claims
the second seat. Opening a link alone does not claim it. Later visitors cannot
replace either player. A room URL is not an invitation and does not grant a seat.
Use separate devices, browser profiles, or browsers: tabs share the same seat.

Both players get a randomly placed fleet on a 6-by-6 grid: ships of lengths
3, 2, and 2. Shuffle before choosing Ready; fleets are locked afterward.
Player 1 goes first once both players are ready. Each move explores one square
and passes the turn, even on a hit. Discover all seven opponent ship squares to
win. Coordinates, hit/miss markings, sunk-ship labels, and turn banners work
with keyboards and small screens. No timer or automatic turn forfeits.
On phones, a compact turn banner stays pinned while scrolling. Game controls
and connection details are collapsed initially, but errors remain visible.
Your ocean stays open during setup; once both players are ready, the opponent's
board comes first and your ocean collapses on phones. Tap **Your ocean** to
inspect it at any time. Live updates preserve your choice to expand or collapse
it. Desktop boards stay side by side and initially expanded.
When the final square of a ship is hit, a prominent, screen-reader-announced
notice tells the attacker they sank a ship and tells its owner they lost one.
Each player's latest sinking notice remains visible across turns and reloads;
all squares of a sunk ship also get a double border. Partial hits and misses
do not trigger a sinking notice.

**Turn alerts:** Action Cable sends live change notices; each browser fetches
its authorized view. The banner and tab title announce "Your turn!".
**Enable turn sounds** opts in to a short local chime, with an initial preview.
Sound is off on reload and may be suspended/delayed by background-tab or device
policies. There are no push, email, or closed-browser alerts in this version.
A disconnected client reconnects automatically, checks state every ten seconds
as a fallback, and refreshes when the tab becomes visible. Connection and request
failures are shown explicitly; **Refresh game** also checks state manually.

Guest seats use a random identifier in an encrypted, HTTP-only, SameSite cookie
(Secure on HTTPS), expiring after 30 days. Only its SHA-256 digest is stored with
each seat. Clearing cookies or moving to a different browser loses the seat;
there is no recovery link or takeover mechanism in this iteration. Rooms expire
after 24 hours without a join, ready, shuffle, or move; passive polling does not
keep them alive. Expired rooms cannot be played or joined.

Game state lives in SQLite, independently of other games' browser progress.
The server validates membership, placement locks, turns, coordinates, repeated
shots, and completion within a locked transaction. A player receives only their
own fleet and resolved shot results, never unexplored opponent ship coordinates.
WebSocket subscriptions require a valid guest seat and broadcast only a revision,
not fleets, invitation links, or guest identifiers. Private pages use no-store
and same-origin referrer headers (no referrers sent to other sites, while keeping
Rails origin checks on same-origin forms). Invitations are bearer links: anyone you share an unused
link with can claim Player 2, so send them privately.

### Running multiplayer

Run `bin/rails db:prepare` before starting/deploying this feature. Rails serves
WebSockets at `/cable`; the existing development `async` adapter needs one Rails
process. Production uses the existing **Solid Cable** adapter and cable database,
so prepare all configured databases and allow WebSocket upgrades through your
HTTPS proxy. Use your application's publicly reachable HTTPS address for friends
on other networks; a localhost link only works on the same computer. No external
messaging or notification service is needed.

Schedule `bin/rails fleet_games:cleanup` (for example hourly) to delete expired
rooms. Expiry is enforced even before cleanup. This first iteration is intended
for trusted private play, not a public matchmaking service.

Run `bin/rails test test/models/fleet_game_test.rb test/controllers/fleet_games_controller_test.rb test/channels/fleet_game_channel_test.rb test/system/fleet_quest_test.rb`
after changing this game.

## Code Breakers

Four code types each offer **Easy, Medium, and Hard** levels with ten puzzles
per round. Choose Symbol codes, Number codes, Letter shifts, or Code Detective.
The three message-decoding types use
the same ten messages at a given level so children can practice different ways
of encoding familiar messages.

- **Easy:** three-letter words with a full decoding key. Numbers use A = 1;
  letter shifts move forward one place when encoding (back one to decode).
- **Medium:** six-letter words with a full key. Letter shifts move three places.
- **Hard:** short phrases, word boundaries, and a message clue. Symbol codes
  show only relevant mappings with one letter missing, inferred from the clue
  and repeated symbols. Number codes count backward (Z = 1 through A = 26).
  Letter shifts move 7–16 places. The number and shift rules stay visible,
  but their full keys are hidden.

Type the decoded word or phrase and press Enter or Check my answer. Case,
leading/trailing whitespace, and repeated spaces are ignored; word boundaries
still matter. Wrong or empty answers give gentle feedback with unlimited retries.
One hint per puzzle decodes its first symbol, number, or letter. Correct answers
unlock Next code; the tenth unlocks Play again. Progress counts solved codes,
without timers, penalties, or saved stars.

Changing the type or level starts a fresh round. Replay keeps both choices;
reload returns to Easy Symbol codes. The game does not read or write saved
progress for other games. Symbols have accessible names, controls work with
the keyboard, and messages and keys wrap on small screens.

**Code Detective** is a deduction game instead of a message-decoding puzzle:

- **Easy:** three positions, four available symbols, no repeated symbols.
- **Medium:** four positions, six symbols, no repeated symbols.
- **Hard:** four positions, six symbols, repeated symbols allowed.

Choose a symbol for each labeled position and check your guess. Each entry
in the guess history reports the total correct symbols, split into those in
the right position and those in a different position; it does not identify
individual matches. Repeated symbols count only as often as they appear in
the secret, with exact-position matches counted first. Empty guesses and
repeats at Easy/Medium show a correction without adding a history entry.
Guesses are unlimited, with no timer or penalty. One optional hint reveals
the first position and stays visible for that puzzle.

Each round generates ten distinct secret codes locally. Solving a code keeps
its guesses visible until Next code; Play again generates a fresh round at
the same level. Changing level/type clears guesses, hints, and round progress.
The secret is hidden until solved (apart from the optional hint). These puzzles
are for learning, so secrets are held in browser memory, not protected against
inspection. The generation and duplicate-aware scoring are in
[code_detective.js](app/javascript/data/code_detective.js).

All messages and cipher rules are bundled locally in
[code_breaker_puzzles.js](app/javascript/data/code_breaker_puzzles.js).
These are learning puzzles, not encryption for protecting real information.
Run `bin/rails test test/controllers/games_controller_test.rb test/system/code_breaker_test.rb test/system/code_detective_test.rb`
after changing this game.

## Spot the Difference

Compare two original illustrations in **ten puzzles**, with two difficulty levels:
**Easy** has five differences per puzzle; **Challenging** has ten, including
smaller details such as missing stripes, spots, and stitches. Easy is the default.
Both levels include a garden, beach, space, reading room, underwater world,
park picnic, farm, bakery, campsite, and snowy afternoon.
Click or tap a changed object in either picture: both pictures mark the
difference, the counter updates, and a written explanation joins the discovery
list. Finding the same detail twice does not increase the count. Other clicks
give gentle encouragement, with no penalties or timer.

Find all differences in your selected level to unlock Next puzzle; the last puzzle offers
Play again. Markings remain visible until you move on. Pictures sit side by
side on larger screens and stack on small screens. Keyboard players can Tab
through picture areas and select them with Enter or Space. This is a visual
comparison activity; descriptions of differences become available after finding
them. Progress is session-only and resets on reload, independently of saved
progress in the other games. Changing levels resets discoveries and returns to
the first puzzle; replay keeps the selected level, while reload returns to Easy.

The artwork and changed regions are bundled locally in
[spot_difference_puzzles.js](app/javascript/data/spot_difference_puzzles.js),
with no external images or APIs. Each SVG image uses a 600-by-400 coordinate
system. Every difference has original and changed shapes, a description, and
a nonoverlapping `[x, y, width, height]` clickable region covering that detail.
Each scene has five `differences` and five extra `challengeDifferences`.
The extra details appear identically in both Easy pictures, with no extra
clickable regions; Challenging changes them and enables all ten regions.
Run `bin/rails test test/controllers/games_controller_test.rb test/system/spot_difference_test.rb`
after changing this game.

## Trivia

Five suggested difficulty levels cover **Grades 1–5**, from familiar everyday
facts to more challenging science, geography, language, history, and number
questions. These are practice levels, not certified curriculum assessments.
An adult can help younger children read the questions.

Each grade has 20 original multiple-choice questions with four distinct
answers, a hint, and an explanation in
[trivia_questions.js](app/javascript/data/trivia_questions.js).
A round draws ten distinct questions from the selected grade; answer order
is shuffled too. Select an answer and press Check my answer. Incorrect guesses
stay on the question and never cost stars. There is one hint per question:
earn two stars without a hint or one with a hint. Correct answers show a short
explanation. Finishing suggests the next grade without switching automatically;
Grade 5 celebrates completing the highest level.

**Solo** is selected by default and keeps unlimited retries. **Play against the
computer** offers a locally simulated opponent: Easy has a 40% chance of a
correct answer, Medium 65%, and Hard 85%, independently for each question.
These probabilities are not guaranteed round scores. Both players answer the
same ten questions with one scored attempt each; one correct answer earns one
match point, including when a hint was used. Empty submissions do not count.
The computer's answer is revealed only after the child's submission. Wrong
answers show the correct answer and explanation before continuing.
The final scoreboard celebrates a win, tie, or the discoveries made in a loss.
Match scores are session-only and separate from saved stars and correct-answer
totals. Switching modes, opponent difficulty, grades, or replaying resets the
round; reloading returns to Solo. No timer or AI service is involved.

Use Tab to reach the answer group, arrow keys to select an answer, then Tab
to Check my answer and press Enter. Total questions solved and stars are saved
locally under `trivia-progress-v1`, independently of the other games. Reloading,
changing grades, or replaying resets the round but preserves saved totals.
Storage failures are shown to the player. There are no timers, accounts, or
external trivia APIs.

Run `bin/rails test test/controllers/games_controller_test.rb test/system/trivia_test.rb`
after changing Trivia.

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
answer; one hint is available per question. Earn one star with a hint or two
without. After ten correct answers,
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
  Letter choices can be reused, and the one hint per word fills one missing letter.
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
- Use one hint per word to fill one letter. Earn two stars for an unassisted
  word or one star with a hint. Incorrect guesses never cost stars.
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

## Read Aloud

Read Aloud offers eight stages:

1. **Beginning words:** 34 short words with short vowels.
2. **Word families:** 26 words grouped by the endings `at`, `an`, `en`, `ug`,
   `it`, `in`, and `op`.
   The changing first letter is highlighted; tap a family word to practice it.
3. **Blends:** 22 words such as stop and frog. Each consonant retains its sound.
4. **Two-letter sounds:** 22 words with `sh`, `ch`, `th` (as in thin), and `ck`.
   Each pair stays together as one letter group.
5. **Silent e:** 22 words such as cape and kite. The final e stays quiet,
   is highlighted with the long vowel, and is included when building a word.
6. **Phrases & sentences:** 20 short readings with tap-to-hear words.
   Helper words such as a, the, I, and is may need adult support.
7. **Easy words:** 50 six-letter vocabulary words.
8. **Medium words:** 50 seven- or eight-letter vocabulary words.

Each round uses the entire selected stage. The extra reading vocabulary lives
only in Read Aloud lessons; Word Quest's spelling banks are unchanged.

Beginning words is selected first. **Read together** offers tap-to-hear groups,
guided hear-and-blend highlighting, typing, optional speech recognition, and
an **I practiced reading** button. For longer vocabulary, the app reads whole
words instead of incorrectly assigning a fixed sound to every letter.
Pictures are hidden by default. **Show picture** reveals an optional picture
clue, and **Hide picture** hides it again. Each new reading, stage, activity,
or restart hides the picture. Revealing it does not use the word-building hint.
Written clues remain visible.
**Build from sounds** is available in the first five stages: listen, arrange
shuffled letter-group tiles, return tiles to edit, and ask for a hint.
Repeated letters have separate tiles; hints preserve only the correct prefix.
There is one hint per word, shared by the hint button and automatic hints after
misses. Switching activities or revisiting a family word does not restore a
used hint. New words and new rounds get a fresh hint. Hearing the reading and
blending sounds remain available without a limit.
Changing stages or activities cancels pending speech and answer advancement.

Browser speech examples are approximations, not recorded phonemes, and vary
by voice and accent. An adult should model short, clear sounds without an added
"uh." Guided audio and visual cues support practice; they are not a phonics
assessment. Microphone mismatches never judge a child's pronunciation or block
progress: children may listen again, type, or mark their reading practice.
Progress is session-only; completing a stage or restarting keeps the selected
activity. Audio failures are displayed, and reading/building remain available
without browser speech support.

Curated lessons and explicit sound groups live in
[read_aloud_lessons.js](app/javascript/data/read_aloud_lessons.js).
The existing New Dolch vocabulary and its attribution are unchanged.
Run `bin/rails test test/controllers/games_controller_test.rb test/system/read_aloud_test.rb`
after changes to reading practice.

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

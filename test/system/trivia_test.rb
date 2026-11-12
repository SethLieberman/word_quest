require "application_system_test_case"

class TriviaTest < ApplicationSystemTestCase
  Capybara.enable_aria_label = true

  setup do
    visit trivia_url
    page.execute_script("localStorage.removeItem('trivia-progress-v1')")
    visit trivia_url
  end

  test "landing page opens trivia and navigation returns to the quest chooser" do
    visit root_url
    find("a.quest-card", text: "Trivia").click
    assert_current_path trivia_path
    assert_text "QUESTION 1 OF 10"
    assert_selector "[data-grade='1'][aria-pressed='true']"
    assert_selector "input[type='radio']", count: 4
    find("nav a[aria-label='Choose a quest']").click
    assert_current_path root_path
    assert_selector ".quest-card", count: 6
  end

  test "empty and wrong answers retry while one hint changes the star award" do
    click_button "Check my answer"
    assert_text "Choose an answer"
    assert_text "QUESTION 1 OF 10"
    question = current_question
    choose question.fetch("choices").find { |choice| choice != question.fetch("answer") }
    click_button "Check my answer"
    assert_text "Not quite"
    assert_text "QUESTION 1 OF 10"
    assert_selector "[data-trivia-target='count']", text: "0", exact_text: true
    assert_text "0 stars"
    click_button "A little hint"
    assert_text question.fetch("hint")
    assert_button "A little hint", disabled: true
    page.execute_script("#{controller_script}.hint()")
    assert_text "You've used your hint"
    choose question.fetch("answer")
    click_button "Check my answer"
    assert_text question.fetch("explanation")
    assert_text "1 star earned!"
    assert_selector "input[type='radio']:disabled", count: 4
    assert_selector "[data-trivia-target='bar'][aria-valuenow='1']"
    assert_equal "10%", page.evaluate_script("document.querySelector('[data-trivia-target=\"fill\"]').style.width")
    click_button "Next question"
    assert_text "QUESTION 2 OF 10"
    assert_button "A little hint", disabled: false
    assert_no_selector "input:checked"
    choose current_question.fetch("answer")
    click_button "Check my answer"
    assert_text "2 stars earned!"
    assert_selector "[data-trivia-target='points']", text: "3 stars"
  end

  test "all five grades complete ten unique questions and reset rounds without losing totals" do
    (1..5).each do |grade|
      click_button "Grade #{grade}", exact: true
      assert_selector "[data-trivia-target='count']", text: "0", exact_text: true
      prompts = []
      10.times do |index|
        question = current_question
        assert_equal grade, question.fetch("grade")
        prompts << question.fetch("prompt")
        choose question.fetch("answer")
        click_button "Check my answer"
        assert_text question.fetch("explanation")
        assert_selector "[data-trivia-target='bar'][aria-valuenow='#{index + 1}']"
        assert_selector ".trail-stop.complete", count: index + 1
        if index < 9
          assert_no_text "Ten discoveries!"
          click_button "Next question"
        end
      end
      assert_equal 10, prompts.uniq.length
      assert_selector "[data-grade='#{grade}'][aria-pressed='true']"
      assert_text grade < 5 ? "Try Grade #{grade + 1} next!" : "You've completed the highest trivia level!"
      assert_selector "[data-trivia-target='points']", text: "#{grade * 20} stars"
      click_button "Play again"
      assert_text "QUESTION 1 OF 10"
      assert_selector "[data-trivia-target='count']", text: "0", exact_text: true
      assert_no_selector ".trail-stop.complete"
      assert_selector "[data-grade='#{grade}'][aria-pressed='true']"
      assert_button "A little hint", disabled: false
    end
    visit trivia_url
    assert_selector "[data-trivia-target='points']", text: "100 stars"
    assert_selector "[data-trivia-target='bar'][aria-valuenow='0']"
    click_button "My progress"
    assert_selector "dialog[open]", text: "questions solved"
    assert_selector ".progress-stats strong", text: "50", exact_text: true
    click_button "Close progress"
    assert_no_selector "dialog[open]"
    click_button "How to play"
    assert_selector "dialog[open]", text: "one hint per question"
    click_button "Close instructions"
    assert_no_selector "dialog[open]"
  end

  test "question banks contain one hundred valid questions and shuffled rounds preserve answers" do
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/trivia_questions").then(({ GRADES, ROUND_LENGTH, questionBank, adventureQuestions }) => {
        const banks = GRADES.map((grade) => ({ grade, entries: questionBank(grade) }));
        const rounds = GRADES.flatMap((grade) => Array.from({length: 10}, () => adventureQuestions(grade)));
        const first = questionBank(1);
        first[0].choices.pop();
        let invalidGrade = null;
        try { questionBank(6); } catch (error) { invalidGrade = error.message; }
        done({ grades: GRADES, length: ROUND_LENGTH, banks, rounds, invalidGrade, originalChoiceCount: questionBank(1)[0].choices.length });
      }).catch((error) => done({error: error.message}));
    JS
    assert_nil report["error"]
    assert_equal [ 1, 2, 3, 4, 5 ], report.fetch("grades")
    assert_equal 10, report.fetch("length")
    assert_equal 4, report.fetch("originalChoiceCount")
    assert_match "Unknown trivia grade", report.fetch("invalidGrade")
    all_questions = report.fetch("banks").flat_map { |bank| bank.fetch("entries") }
    assert_equal 100, all_questions.length
    assert_equal 100, all_questions.map { |question| question.fetch("id") }.uniq.length
    report.fetch("banks").each do |bank|
      entries = bank.fetch("entries")
      assert_equal 20, entries.length
      assert_equal 20, entries.map { |question| question.fetch("prompt") }.uniq.length
      assert_operator entries.map { |question| question.fetch("category") }.uniq.length, :>=, 5
      entries.each do |question|
        assert_equal bank.fetch("grade"), question.fetch("grade")
        %w[prompt category answer hint explanation].each { |key| assert question.fetch(key).present?, key }
        choices = question.fetch("choices")
        assert_equal 4, choices.length
        assert_equal choices, choices.uniq
        assert_equal 1, choices.count(question.fetch("answer"))
      end
    end
    report.fetch("rounds").each do |round|
      assert_equal 10, round.length
      assert_equal 10, round.map { |question| question.fetch("id") }.uniq.length
      assert_equal 1, round.map { |question| question.fetch("grade") }.uniq.length
    end
  end

  test "every question accepts its correct answer and prevents duplicate star awards" do
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/trivia_questions").then(({ GRADES, questionBank }) => {
        const trivia = #{controller_script};
        const results = [];
        for (const grade of GRADES) {
          for (const question of questionBank(grade)) {
            trivia.grade = grade;
            trivia.deck = [question];
            trivia.completed = 0;
            trivia.nextQuestion(false);
            const before = trivia.progress.stars;
            const choices = [...trivia.choicesTarget.querySelectorAll("input")];
            choices.find((input) => input.value === question.answer).checked = true;
            trivia.check({preventDefault() {}});
            results.push({
              id: question.id, solved: trivia.solved, count: trivia.completed,
              stars: trivia.progress.stars - before,
              choices: choices.map((input) => input.value),
              explanation: trivia.feedbackTarget.textContent.includes(question.explanation)
            });
            // The next-question action is separate from awarding this answer.
            trivia.finished = true;
            trivia.check({preventDefault() {}});
            if (trivia.progress.stars !== before + 2) throw new Error("Duplicate star award");
          }
        }
        done(results);
      }).catch((error) => done({error: error.message}));
    JS
    assert_kind_of Array, report
    assert_equal 100, report.length
    report.each do |result|
      assert result.fetch("solved"), result.fetch("id")
      assert_equal 1, result.fetch("count")
      assert_equal 2, result.fetch("stars")
      assert_equal 4, result.fetch("choices").uniq.length
      assert result.fetch("explanation")
    end
  end

  test "trivia storage is independent and storage failures remain visible without blocking play" do
    page.execute_script(<<~JS)
      localStorage.setItem("word-quest-progress-v1", JSON.stringify({total: 10, stars: 20, days: {}}));
      localStorage.setItem("math-quest-progress-v1", JSON.stringify({total: 7, stars: 14}));
      localStorage.setItem("trivia-progress-v1", "{broken");
    JS
    visit trivia_url
    assert_text "Saved trivia progress couldn't be loaded."
    assert_text "0 stars"
    choose current_question.fetch("answer")
    click_button "Check my answer"
    saved = page.evaluate_script("JSON.parse(localStorage.getItem('trivia-progress-v1'))")
    assert_equal({ "total" => 1, "stars" => 2 }, saved)
    assert_equal 20, page.evaluate_script("JSON.parse(localStorage.getItem('word-quest-progress-v1')).stars")
    assert_equal 14, page.evaluate_script("JSON.parse(localStorage.getItem('math-quest-progress-v1')).stars")

    page.execute_script("Storage.prototype.setItem = function() { throw new Error('Storage unavailable'); }")
    click_button "Next question"
    choose current_question.fetch("answer")
    click_button "Check my answer"
    assert_text "Your browser couldn't save trivia progress."
    assert_text "You did it!"
    assert_text "4 stars"
  end

  test "invalid saved totals show a notice and start fresh" do
    page.execute_script("localStorage.setItem('trivia-progress-v1', JSON.stringify({total: -1, stars: 'many'}))")
    visit trivia_url
    assert_text "Saved trivia progress couldn't be loaded."
    assert_text "0 stars"
    assert_text "QUESTION 1 OF 10"
  end

  test "computer matches score one attempt each and keep match points separate from stars" do
    assert_no_selector "[data-trivia-target='scoreboard']"
    click_button "Play against the computer"
    assert_selector "[data-mode='computer'][aria-pressed='true']"
    assert_selector "[data-trivia-target='playerScore']", text: "0", exact_text: true
    assert_selector "[data-trivia-target='computerScore']", text: "0", exact_text: true
    page.execute_script("window.originalTriviaRandom = Math.random; Math.random = () => 0")
    click_button "Check my answer"
    assert_text "Choose an answer"
    assert_equal "", page.evaluate_script("#{controller_script}.computerFeedbackTarget.textContent")
    assert_selector "[data-trivia-target='count']", text: "0", exact_text: true
    question = current_question
    choose question.fetch("choices").find { |choice| choice != question.fetch("answer") }
    click_button "Check my answer"
    assert_text "Good try! The answer is #{question.fetch('answer')}."
    assert_text question.fetch("explanation")
    assert_text "Computer chose #{question.fetch('answer')}."
    assert_selector "[data-trivia-target='computerScore']", text: "1", exact_text: true
    assert_selector "[data-trivia-target='playerScore']", text: "0", exact_text: true
    assert_text "0 stars"
    assert_selector "input[type='radio']:disabled", count: 4
    assert_button "A little hint", disabled: true
    click_button "Next question"
    assert_text "QUESTION 2 OF 10"
    assert_equal "", page.evaluate_script("#{controller_script}.computerFeedbackTarget.textContent")
    assert_button "A little hint", disabled: false
    click_button "A little hint"
    choose current_question.fetch("answer")
    click_button "Check my answer"
    assert_text "1 star earned!"
    assert_selector "[data-trivia-target='playerScore']", text: "1", exact_text: true
    assert_selector "[data-trivia-target='computerScore']", text: "2", exact_text: true
    assert_equal({ "total" => 1, "stars" => 1 }, page.evaluate_script("JSON.parse(localStorage.getItem('trivia-progress-v1'))"))
    find_button("Next question").send_keys(:enter)
    assert_text "QUESTION 3 OF 10"
    assert_selector "[data-trivia-target='computerScore']", text: "2", exact_text: true
  ensure
    page.execute_script("if (window.originalTriviaRandom) Math.random = window.originalTriviaRandom")
  end

  test "computer difficulty uses exact probabilities and always selects an available answer" do
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("controllers/trivia_controller").then(({ COMPUTER_DIFFICULTIES, computerAnswer }) => {
        const question = {answer: "Right", choices: ["Right", "Wrong A", "Wrong B", "Wrong C"]};
        const original = Math.random;
        const results = [];
        try {
          for (const [difficulty, threshold] of Object.entries(COMPUTER_DIFFICULTIES)) {
            for (const value of [0, threshold - 0.000001, threshold, 0.999999]) {
              Math.random = () => value;
              results.push({difficulty, value, answer: computerAnswer(question, difficulty)});
            }
          }
        } finally { Math.random = original; }
        let invalid = "";
        try { computerAnswer(question, "unknown"); } catch (error) { invalid = error.message; }
        done({thresholds: COMPUTER_DIFFICULTIES, results, invalid});
      }).catch((error) => done({error: error.message}));
    JS
    assert_nil report["error"]
    thresholds = { "easy" => 0.4, "medium" => 0.65, "hard" => 0.85 }
    assert_equal thresholds, report.fetch("thresholds")
    report.fetch("results").each do |result|
      assert_includes [ "Right", "Wrong A", "Wrong B", "Wrong C" ], result.fetch("answer")
      assert_equal result.fetch("value") < thresholds.fetch(result.fetch("difficulty")), result.fetch("answer") == "Right"
    end
    assert_match "Unknown computer difficulty", report.fetch("invalid")
  end

  test "computer rounds celebrate wins ties and losses and replay resets scores" do
    click_button "Play against the computer"
    %w[win tie loss].each do |outcome|
      page.execute_script(<<~JS, outcome)
        const trivia = #{controller_script};
        trivia.startAdventure(1);
        window.originalTriviaRandom = Math.random;
        Math.random = () => arguments[0] === "win" ? 0.999999 : 0;
      JS
      10.times do |index|
        question = current_question
        answer = outcome == "loss" ? question.fetch("choices").find { |choice| choice != question.fetch("answer") } : question.fetch("answer")
        choose answer
        click_button "Check my answer"
        assert_selector "[data-trivia-target='bar'][aria-valuenow='#{index + 1}']"
        click_button "Next question" if index < 9
      end
      message = { "win" => "You won!", "tie" => "It's a tie!", "loss" => "The computer won this round." }.fetch(outcome)
      assert_selector "[data-trivia-target='matchResult']", text: message
      assert_selector "[data-trivia-target='playerScore']", text: outcome == "loss" ? "0" : "10", exact_text: true
      assert_selector "[data-trivia-target='computerScore']", text: outcome == "win" ? "0" : "10", exact_text: true
      assert_text "QUESTION 10 OF 10"
      page.execute_script("Math.random = window.originalTriviaRandom")
      click_button "Play again"
      assert_text "QUESTION 1 OF 10"
      assert_selector "[data-mode='computer'][aria-pressed='true']"
      assert_selector "[data-trivia-target='playerScore']", text: "0", exact_text: true
      assert_selector "[data-trivia-target='computerScore']", text: "0", exact_text: true
      assert_equal "", page.evaluate_script("#{controller_script}.matchResultTarget.textContent")
    end
    assert_text "40 stars"
  ensure
    page.execute_script("if (window.originalTriviaRandom) Math.random = window.originalTriviaRandom")
  end

  test "changing mode difficulty grade or reloading resets a match without losing stars" do
    click_button "Play against the computer"
    choose current_question.fetch("answer")
    click_button "Check my answer"
    assert_selector "[data-trivia-target='playerScore']", text: "1", exact_text: true
    select "Hard", from: "Computer difficulty"
    assert_text "QUESTION 1 OF 10"
    assert_selector "[data-trivia-target='playerScore']", text: "0", exact_text: true
    assert_selector "[data-trivia-target='computerScore']", text: "0", exact_text: true
    click_button "Grade 3", exact: true
    assert_selector "option[value='hard']:checked"
    assert_selector "[data-mode='computer'][aria-pressed='true']"
    click_button "Solo"
    assert_no_selector "[data-trivia-target='scoreboard']"
    assert_no_selector "#trivia-computer-difficulty"
    question = current_question
    choose question.fetch("choices").find { |choice| choice != question.fetch("answer") }
    click_button "Check my answer"
    assert_text "Not quite"
    assert_text "QUESTION 1 OF 10"
    visit trivia_url
    assert_selector "[data-mode='solo'][aria-pressed='true']"
    assert_text "2 stars"
    assert_text "QUESTION 1 OF 10"
  end

  test "mobile trivia supports keyboard answers and stays within the viewport" do
    page.current_window.resize_to(320, 900)
    visit root_url
    find("a.quest-card", text: "Trivia").click
    click_button "Grade 5", exact: true
    click_button "Play against the computer"
    select "Medium", from: "Computer difficulty"
    answer = current_question.fetch("answer")
    input = find("input[type='radio']", match: :first)
    choices = all("input[type='radio']").map { |choice| choice["value"] }
    input.send_keys(:space)
    choices.index(answer).times { page.driver.browser.switch_to.active_element.send_keys(:arrow_right) }
    assert_selector "input:checked", count: 1
    assert_equal answer, find("input:checked")["value"]
    find_button("Check my answer").send_keys(:enter)
    assert_text "You did it!"
    assert_selector "[data-trivia-target='playerScore']", text: "1", exact_text: true
    assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
    find_button("Next question").send_keys(:enter)
    assert_text "QUESTION 2 OF 10"
    assert_equal "radio", page.evaluate_script("document.activeElement.type")
    assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
    click_button "How to play"
    assert_selector "dialog[open]"
    find("dialog[open]").send_keys(:escape)
    assert_no_selector "dialog[open]"
  ensure
    page.current_window.resize_to(1400, 1400)
  end

  private

  def controller_script
    'window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller=\'trivia\']"), "trivia")'
  end

  def current_question
    page.evaluate_script("#{controller_script}.question")
  end
end

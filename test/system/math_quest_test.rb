require "application_system_test_case"

class MathQuestTest < ApplicationSystemTestCase
  setup do
    visit math_quest_url
    page.execute_script("localStorage.removeItem('math-quest-progress-v1'); localStorage.removeItem('word-quest-progress-v1')")
    visit math_quest_url
  end

  test "landing cards navigate between games without losing separate progress" do
    visit root_url
    click_link "Word Quest"
    assert_selector "[data-controller='game']"
    click_button "Choose B"
    click_button "Check my word"
    assert_text "2 stars"
    find("nav a[aria-label='Choose a quest']").click
    click_link "Math Quest"
    assert_selector "[data-controller='math']"
    assert_selector "[data-math-target='points']", text: "0 stars"
    fill_in "Your answer", with: current_answer
    click_button "Check my answer"
    assert_text "2 stars for growing"
    click_link "Try Word Quest"
    assert_selector "[data-game-target='points']", text: "2 stars"
    find("nav a[aria-label='Choose a quest']").click
    click_link "Math Quest"
    assert_selector "[data-math-target='points']", text: "2 stars"
    assert_selector "[data-math-target='count']", text: "0", exact_text: true
  end

  test "invalid and wrong answers retry while hints change the star award" do
    answer = current_answer
    [ "", "abc", "1.5", "-1", "1e2", "999999999999999999999" ].each do |value|
      fill_in "Your answer", with: value
      click_button "Check my answer"
      assert_text "Enter a whole number"
      assert_selector "#math-answer[aria-invalid='true']"
      assert_text "QUESTION 1 OF 10"
    end
    fill_in "Your answer", with: answer + 1
    find("#math-answer").send_keys(:enter)
    assert_text "Not quite"
    assert_selector "[data-math-target='count']", text: "0", exact_text: true
    click_button "A little hint"
    assert_text "count"
    fill_in "Your answer", with: answer
    find("#math-answer").send_keys(:enter)
    assert_text "1 star for growing"
    assert_selector "[data-math-target='bar'][aria-valuenow='1']"
    assert_selector "#math-answer:disabled"
    click_button "Next question"
    assert_text "QUESTION 2 OF 10"
    fill_in "Your answer", with: current_answer
    click_button "Check my answer"
    assert_text "2 stars for growing"
    assert_selector "[data-math-target='points']", text: "3 stars"
    click_button "My progress"
    assert_selector "dialog[open]", text: "questions solved"
    click_button "Close progress"
    click_button "How to play"
    assert_selector "dialog[open]", text: "parentheses first"
    click_button "Close instructions"
  end

  test "all six levels complete ten unique questions and reset goals without losing stars" do
    levels = [
      [ "sprout", "Number explorer" ], [ "explorer", "Multiplication magic" ],
      [ "multiply", "Division detective" ], [ "divide", "Operation expert" ],
      [ "mixed", "Equation mastermind" ], [ "equations", nil ]
    ]
    levels.each_with_index do |(level, next_level), level_index|
      find("[data-level='#{level}']").click
      assert_selector "[data-math-target='count']", text: "0", exact_text: true
      expressions = []
      10.times do |index|
        expressions << find("[data-math-target='expression']").text
        fill_in "Your answer", with: current_answer
        find("#math-answer").send_keys(:enter)
        assert_text "2 stars for growing"
        assert_selector "[data-math-target='bar'][aria-valuenow='#{index + 1}']"
        assert_equal "#{(index + 1) * 10}%", page.evaluate_script("document.querySelector('[data-math-target=\"fill\"]').style.width")
        if index < 9
          assert_no_text "Try #{next_level} next!" if next_level
          click_button "Next question"
        end
      end
      assert_equal 10, expressions.uniq.length
      assert_selector ".trail-stop.complete", count: 10
      assert_selector "[data-level='#{level}'][aria-pressed='true']"
      if next_level
        assert_text "Try #{next_level} next!"
      else
        assert_text "Congratulations, you've completed the highest level!"
      end
      assert_selector "[data-math-target='points']", text: "#{(level_index + 1) * 20} stars"
      click_button "Play again"
      assert_text "QUESTION 1 OF 10"
      assert_selector "[data-math-target='count']", text: "0", exact_text: true
      assert_no_selector ".trail-stop.complete"
      assert_no_text "Adventure goal complete"
    end
    visit math_quest_url
    assert_selector "[data-math-target='points']", text: "120 stars"
    click_button "My progress"
    assert_selector ".progress-stats strong", text: "60", exact_text: true
  end

  test "every generated question has correct arithmetic and respects level bounds" do
    report = page.driver.browser.execute_async_script(<<~JS)
      const done = arguments[0];
      import("data/math_questions").then(({ LEVELS, questionBank, adventureQuestions }) => {
        function calculate(expression) {
          const tokens = expression.match(/\\d+|[()+×÷−]/g);
          let index = 0;
          function atom() {
            if (tokens[index] === "(") {
              index++;
              const value = sum();
              if (tokens[index++] !== ")") throw new Error("Unbalanced parentheses");
              return value;
            }
            return Number(tokens[index++]);
          }
          function product() {
            let value = atom();
            while (tokens[index] === "×" || tokens[index] === "÷") {
              const operation = tokens[index++];
              const other = atom();
              value = operation === "×" ? value * other : value / other;
            }
            return value;
          }
          function sum() {
            let value = product();
            while (tokens[index] === "+" || tokens[index] === "−") {
              const operation = tokens[index++];
              const other = product();
              value = operation === "+" ? value + other : value - other;
            }
            return value;
          }
          const result = sum();
          if (index !== tokens.length) throw new Error("Unconsumed tokens");
          return result;
        }
        const failures = [];
        const counts = {};
        for (const { id } of LEVELS) {
          const bank = questionBank(id);
          counts[id] = bank.length;
          const unique = new Set(bank.map(q => q.expression));
          if (unique.size !== bank.length) failures.push(`${id}: duplicates`);
          const deck = adventureQuestions(id);
          if (deck.length !== 10 || new Set(deck.map(q => q.expression)).size !== 10) failures.push(`${id}: invalid adventure`);
          for (const question of bank) {
            if (!Number.isSafeInteger(question.answer) || question.answer < 0 || !question.hint) failures.push(question.expression);
            const expression = question.expression.replace("?", String(question.answer));
            const sides = expression.split(" = ");
            if (calculate(sides[0]) !== (sides.length === 2 ? calculate(sides[1]) : question.answer)) failures.push(question.expression);
            const numbers = question.expression.match(/\\d+/g).map(Number);
            if (id === "sprout" || id === "explorer") {
              const limit = id === "sprout" ? 20 : 100;
              if (numbers.some(n => n < 0 || n > limit) || question.answer > limit) failures.push(`${id}: bounds`);
              if (id === "explorer" && Math.max(...numbers, question.answer) <= 20) failures.push("Explorer too easy");
            }
            if (id === "multiply" && numbers.some(n => n < 1 || n > 12)) failures.push("Multiplication bounds");
            if (id === "divide" && (numbers[1] < 1 || numbers[1] > 12 || question.answer > 12)) failures.push("Division bounds");
          }
        }
        done({ counts, failures });
      }).catch(error => done({ error: error.message }));
    JS
    assert_nil report["error"]
    assert_empty report.fetch("failures")
    assert_equal 6, report.fetch("counts").length
    assert report.fetch("counts").values.all? { |count| count >= 100 }
  end

  test "storage errors surface and do not stop math play" do
    page.execute_script("localStorage.setItem('math-quest-progress-v1', '{broken')")
    visit math_quest_url
    assert_text "Saved math progress couldn't be loaded"
    fill_in "Your answer", with: current_answer
    click_button "Check my answer"
    assert_text "You did it!"
    page.execute_script("Storage.prototype.setItem = function() { throw new Error('Storage unavailable'); }")
    click_button "Next question"
    fill_in "Your answer", with: current_answer
    click_button "Check my answer"
    assert_text "Your browser couldn't save math progress"
    assert_text "You did it!"
  end

  test "math layout fits mobile and supports keyboard navigation" do
    page.current_window.resize_to(320, 900)
    visit root_url
    assert_selector ".quest-card", count: 2
    assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
    click_link "Math Quest"
    find("[data-level='mixed']").click
    fill_in "Your answer", with: current_answer
    find("#math-answer").send_keys(:enter)
    assert_text "You did it!"
    assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
    assert_selector ".trail-stop", count: 10
    assert_equal 2, page.evaluate_script("new Set([...document.querySelectorAll('.trail-stop')].map(el => el.offsetTop)).size")
  ensure
    page.current_window.resize_to(1400, 1400)
  end

  private

  def current_answer
    page.evaluate_script(<<~JS)
      window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller='math']"), "math").question.answer
    JS
  end
end

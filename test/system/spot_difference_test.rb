require "application_system_test_case"

class SpotDifferenceTest < ApplicationSystemTestCase
  Capybara.enable_aria_label = true

  test "landing page opens two original pictures and navigation returns home" do
    visit root_url
    find("a.quest-card", text: "Spot the Difference").click
    assert_current_path spot_difference_path
    assert_text "Sunny garden"
    assert_text "PUZZLE 1 OF 10"
    assert_selector "[data-level='easy'][aria-pressed='true']"
    assert_text "0 of 5 differences found"
    assert_selector ".spot-board svg[role='img']", count: 2
    assert_selector ".spot-hotspot[aria-pressed='false']", count: 10
    assert_no_selector ".is-found"
    assert_button "Next puzzle", disabled: true
    click_link "Choose a quest"
    assert_current_path root_path
    assert_selector ".quest-card", count: 6
  end

  test "clicking either picture marks both and repeated finds do not count twice" do
    visit spot_difference_url
    find("[data-picture='1'] [data-difference='sun']").click
    assert_text "1 of 5 differences found"
    assert_selector "[data-difference='sun'].is-found[aria-pressed='true']", count: 2
    assert_selector ".spot-discoveries li", count: 1
    assert_text "The sun is yellow in Picture 1 and orange in Picture 2."
    find("[data-picture='2'] [data-difference='sun']").click
    assert_text "You already found that difference."
    assert_text "1 of 5 differences found"
    assert_selector ".spot-discoveries li", count: 1
    find("[data-picture='2'] [data-difference='cloud']").click
    assert_text "2 of 5 differences found"
    assert_selector "[data-difference='cloud'].is-found", count: 2
    assert_selector "[role='progressbar'][aria-valuenow='2']"
    assert_equal "40%", page.evaluate_script("document.querySelector('[data-spot-difference-target=\"fill\"]').style.width")
    assert_button "Next puzzle", disabled: true
  end

  test "wrong clicks are gentle and cannot advance an unfinished puzzle" do
    visit spot_difference_url
    find("[data-picture='1'] svg").click(x: 5, y: 5)
    assert_text "Keep looking!"
    assert_text "0 of 5 differences found"
    assert_no_selector ".is-found"
    page.execute_script("#{controller_script}.nextPuzzle()")
    assert_text "PUZZLE 1 OF 10"
    assert_text "Sunny garden"
  end

  test "all ten puzzles have ten distinct differences with bounded nonoverlapping hotspots" do
    visit spot_difference_url
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/spot_difference_puzzles").then(({PUZZLES, PICTURE_WIDTH, PICTURE_HEIGHT}) => {
        done({
          width: PICTURE_WIDTH, height: PICTURE_HEIGHT,
          puzzles: PUZZLES.map((puzzle) => ({
            id: puzzle.id, title: puzzle.title, background: puzzle.background,
            shapes: puzzle.shapes.length,
            easyCount: puzzle.differences.length, extraCount: puzzle.challengeDifferences.length,
            differences: [...puzzle.differences, ...puzzle.challengeDifferences].map((difference) => ({
              id: difference.id, bounds: difference.bounds, description: difference.description,
              distinct: JSON.stringify(difference.original) !== JSON.stringify(difference.changed),
              original: difference.original.length,
              artworkBounds: ["original", "changed"].flatMap((version) => {
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                document.body.append(svg);
                difference[version].forEach(({tag, attrs}) => {
                  const shape = document.createElementNS(svg.namespaceURI, tag);
                  Object.entries(attrs).forEach(([name, value]) => shape.setAttribute(name, value));
                  svg.append(shape);
                });
                const bounds = svg.children.length ? svg.getBBox() : null;
                const result = bounds ? [[bounds.x, bounds.y, bounds.width, bounds.height]] : [];
                svg.remove();
                return result;
              })
            }))
          }))
        });
      }).catch((error) => done({error: error.message}));
    JS
    assert_nil report["error"]
    puzzles = report.fetch("puzzles")
    assert_equal 10, puzzles.length
    assert_equal 10, puzzles.map { |puzzle| puzzle.fetch("id") }.uniq.length
    puzzles.each do |puzzle|
      assert puzzle.fetch("title").present?
      assert puzzle.fetch("background").present?
      assert_operator puzzle.fetch("shapes"), :>, 5
      differences = puzzle.fetch("differences")
      assert_equal 5, puzzle.fetch("easyCount")
      assert_equal 5, puzzle.fetch("extraCount")
      assert_equal 10, differences.length
      assert_equal 10, differences.map { |difference| difference.fetch("id") }.uniq.length
      differences.each do |difference|
        assert difference.fetch("distinct"), difference.fetch("id")
        assert difference.fetch("description").present?
        assert_operator difference.fetch("original"), :>, 0
        x, y, width, height = difference.fetch("bounds")
        assert_operator x, :>=, 0
        assert_operator y, :>=, 0
        assert_operator width, :>, 0
        assert_operator height, :>, 0
        assert_operator x + width, :<=, report.fetch("width")
        assert_operator y + height, :<=, report.fetch("height")
        difference.fetch("artworkBounds").each do |shape_x, shape_y, shape_width, shape_height|
          assert shape_x >= x && shape_y >= y && shape_x + shape_width <= x + width && shape_y + shape_height <= y + height,
            "Artwork outside hotspot: #{puzzle.fetch('id')}/#{difference.fetch('id')}"
        end
      end
      differences.combination(2) do |a, b|
        x, y, width, height = a.fetch("bounds")
        other_x, other_y, other_width, other_height = b.fetch("bounds")
        assert x + width <= other_x || other_x + other_width <= x || y + height <= other_y || other_y + other_height <= y,
          "Overlapping hotspots in #{puzzle.fetch('id')}"
      end
    end
  end

  test "finishing every scene keeps markings visible and replay resets the game" do
    visit spot_difference_url
    [ [ "Easy: 5 differences", 5 ], [ "Challenging: 10 differences", 10 ] ].each do |level, total|
      click_button level
      10.times do |index|
        assert_text "PUZZLE #{index + 1} OF 10"
        assert_text "0 of #{total} differences found"
        assert_no_selector ".spot-discoveries li"
        assert_no_selector ".is-found"
        differences = all("[data-picture='1'] .spot-hotspot").map { |button| button["data-difference"] }
        assert_equal total, differences.length
        differences.each_with_index do |id, position|
          picture = position.even? ? 1 : 2
          find("[data-picture='#{picture}'] [data-difference='#{id}']").click
          assert_text "#{position + 1} of #{total} differences found"
          assert_button(index < 9 ? "Next puzzle" : "Play again", disabled: position + 1 < total)
        end
        assert_selector ".is-found", count: total * 2
        assert_selector ".spot-discoveries li", count: total
        assert_equal "100%", page.evaluate_script("document.querySelector('[data-spot-difference-target=\"fill\"]').style.width")
        if index < 9
          assert_text "You found all #{total} differences!"
          click_button "Next puzzle"
        else
          assert_text "You finished every puzzle!"
          click_button "Play again"
        end
        assert_equal "H2", page.evaluate_script("document.activeElement.tagName")
      end
      assert_text "PUZZLE 1 OF 10"
      assert_text "Sunny garden"
      assert_text "0 of #{total} differences found"
      assert_button "Next puzzle", disabled: true
    end
  end

  test "every marked area contains a visible change only at its intended level" do
    visit spot_difference_url
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      (async () => {
        const { PUZZLES, PICTURE_WIDTH, PICTURE_HEIGHT } = await import("data/spot_difference_puzzles");
        const controller = #{controller_script};
        const canvas = document.createElement("canvas");
        canvas.width = PICTURE_WIDTH;
        canvas.height = PICTURE_HEIGHT;
        const context = canvas.getContext("2d");
        const pixels = async (svg) => {
          const copy = svg.cloneNode(true);
          copy.setAttribute("width", PICTURE_WIDTH);
          copy.setAttribute("height", PICTURE_HEIGHT);
          const image = new Image();
          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error("Could not render puzzle artwork"));
            image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(copy));
          });
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, canvas.width, canvas.height).data;
        };
        const results = [];
        for (const difficulty of ["easy", "challenge"]) {
          controller.difficulty = difficulty;
          for (let index = 0; index < PUZZLES.length; index++) {
            controller.index = index;
            controller.showPuzzle();
            const images = await Promise.all([...document.querySelectorAll(".spot-board svg")].map(pixels));
            const puzzle = PUZZLES[index];
            [...puzzle.differences, ...puzzle.challengeDifferences].forEach((difference, position) => {
              const [x, y, width, height] = difference.bounds;
              let changedPixels = 0;
              for (let row = y; row < y + height; row++) {
                for (let column = x; column < x + width; column++) {
                  const offset = (row * PICTURE_WIDTH + column) * 4;
                  if (images[0][offset] !== images[1][offset] ||
                      images[0][offset + 1] !== images[1][offset + 1] ||
                      images[0][offset + 2] !== images[1][offset + 2]) changedPixels++;
                }
              }
              results.push({
                id: `${puzzle.id}/${difference.id}/${difficulty}`,
                active: difficulty === "challenge" || position < 5,
                changedPixels
              });
            });
          }
        }
        return { results };
      })().then(done).catch((error) => done({ error: error.message }));
    JS
    assert_nil report["error"]
    assert_equal 200, report.fetch("results").length
    report.fetch("results").each do |result|
      if result.fetch("active")
        assert_operator result.fetch("changedPixels"), :>=, 10, result.fetch("id")
      else
        assert_equal 0, result.fetch("changedPixels"), result.fetch("id")
      end
    end
  end

  test "switching levels resets the puzzle and extra details change only in challenging mode" do
    visit spot_difference_url
    easy_shapes = page.evaluate_script('Array.from(document.querySelector("[data-picture=\'1\'] svg").children).map((shape) => shape.outerHTML)')
    find("[data-picture='1'] [data-difference='sun']").click
    click_button "Challenging: 10 differences"
    assert_text "0 of 10 differences found"
    assert_text "Find 10 differences"
    assert_selector "[data-level='challenge'][aria-pressed='true']"
    assert_selector "[role='progressbar'][aria-valuemax='10'][aria-valuenow='0']"
    assert_selector ".spot-hotspot", count: 20
    assert_no_selector ".is-found"
    assert_equal easy_shapes, page.evaluate_script('Array.from(document.querySelector("[data-picture=\'1\'] svg").children).map((shape) => shape.outerHTML)')
    find("[data-picture='2'] [data-difference='apple']").click
    assert_text "1 of 10 differences found"
    find("[data-picture='1'] [data-difference='apple']").click
    assert_text "1 of 10 differences found"
    assert_selector ".spot-discoveries li", count: 1
    click_button "Challenging: 10 differences"
    assert_text "1 of 10 differences found"
    all("[data-picture='1'] .spot-hotspot:not(.is-found)").each(&:click)
    click_button "Next puzzle"
    assert_text "PUZZLE 2 OF 10"
    click_button "Easy: 5 differences"
    assert_text "PUZZLE 1 OF 10"
    assert_text "0 of 5 differences found"
    assert_text "Find 5 differences"
    assert_selector "[data-level='easy'][aria-pressed='true']"
    assert_selector ".spot-hotspot", count: 10
    assert_no_selector "[data-difference='apple']"
    assert_no_selector ".spot-discoveries li"
    assert_button "Next puzzle", disabled: true
    page.execute_script("#{controller_script}.nextPuzzle()")
    assert_text "PUZZLE 1 OF 10"
  end

  test "keyboard and mobile touch find the same areas and picture controls stay aligned" do
    visit spot_difference_url
    [ 1400, 375, 320 ].each do |width|
      page.current_window.resize_to(width, 1000)
      visit spot_difference_url
      assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
      aligned = page.evaluate_script(<<~JS)
        [...document.querySelectorAll(".spot-board")].every((board) => {
          const image = board.querySelector("svg").getBoundingClientRect();
          return [...board.querySelectorAll("button")].every((button) => {
            const box = button.getBoundingClientRect();
            return box.left >= image.left - 1 && box.right <= image.right + 1 &&
              box.top >= image.top - 1 && box.bottom <= image.bottom + 1 &&
              box.width >= 24 && box.height >= 24;
          });
        })
      JS
      assert aligned, "Picture controls should stay within the artwork at #{width}px"
      find("[data-picture='1'] [data-difference='sun']").send_keys(:enter)
      assert_text "1 of 5 differences found"
      find("[data-picture='2'] [data-difference='cloud']").send_keys(:space)
      assert_text "2 of 5 differences found"
      find("[data-picture='2'] [data-difference='flower']").click
      assert_text "3 of 5 differences found"
      find("[data-level='challenge']").send_keys(:enter)
      assert_text "0 of 10 differences found"
      find("[data-picture='2'] [data-difference='knob']").send_keys(:space)
      assert_text "1 of 10 differences found"
      layout_errors = page.evaluate_script(<<~JS)
        (() => {
          const controller = #{controller_script};
          const errors = [];
          for (let index = 0; index < 10; index++) {
            controller.index = index;
            controller.showPuzzle();
            document.querySelectorAll(".spot-board").forEach((board) => {
              const image = board.querySelector("svg").getBoundingClientRect();
              board.querySelectorAll("button").forEach((button) => {
                const box = button.getBoundingClientRect();
                if (box.left < image.left - 1 || box.right > image.right + 1 ||
                    box.top < image.top - 1 || box.bottom > image.bottom + 1 ||
                    box.width < 24 || box.height < 24) {
                  errors.push(`${controller.puzzle.id}/${button.dataset.difference}`);
                }
              });
            });
          }
          return errors;
        })()
      JS
      assert_empty layout_errors, "Challenging controls should stay aligned at #{width}px"
    end
  ensure
    page.current_window.resize_to(1400, 1400)
  end

  test "reloading starts fresh without changing other game progress" do
    visit spot_difference_url
    page.execute_script("localStorage.setItem('trivia-progress-v1', JSON.stringify({total: 3, stars: 6}))")
    click_button "Challenging: 10 differences"
    find("[data-picture='1'] [data-difference='sun']").click
    assert_text "1 of 10 differences found"
    visit spot_difference_url
    assert_text "0 of 5 differences found"
    assert_selector "[data-level='easy'][aria-pressed='true']"
    assert_equal({ "total" => 3, "stars" => 6 }, page.evaluate_script("JSON.parse(localStorage.getItem('trivia-progress-v1'))"))
  end

  private

  def controller_script
    'window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller=\'spot-difference\']"), "spot-difference")'
  end
end

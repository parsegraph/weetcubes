const assert = require("assert");
import todo from "../dist/weetcubes";

describe("Package", function () {
  it("works", () => {
    assert.equal(todo(), 42);
  });
});

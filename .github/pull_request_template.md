## Summary

Please provide a short description of the changes and provide the minimum required context to review the PR. Feel free to also include screenshots, videos, links or whatever might be relevant to the PR and that will facilitate the review process.

### How to test

If they're not obvious, please provide the steps to test this PR, otherwise, delete this section.

### Checklist

Delete any section that is not relevant to your PR. Once this checklist has been completed, please tag everyone as reviewers and post the link to your PR in #ivs-rocks-devs.

#### General

- [ ] My branch is up to date with `main` or at least does not have conflicts
- [ ] My code has been linted and formatted
- [ ] The PR checks have succeeded (includes lint and tests)
- [ ] I have named my PR following [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [ ] I have performed a self-review of my own code
- [ ] I have deleted anything that is unrelated to my change (e.g.: debug logs, IDE config files...)
- [ ] I have ensured that my changes have not created a regression

#### Frontend

- [ ] My visual changes are aligned with the mockup
- [ ] I have checked both DARK and LIGHT modes
- [ ] I have successfully run all the E2E tests locally and updated the relevant screenshots
- [ ] I have completed the [FE testing matrix](https://docs.google.com/spreadsheets/d/1Sa3F6AP-xQJQQwUu8Rfy8eysvUX3zb113GSvJG7v2Tw/edit#gid=0)
- [ ] I have set the correct aria attributes (e.g.: label on icon buttons)

#### Backend

- [ ] I have successfully run all the unit tests locally
- [ ] I have completed the [BE testing matrix](https://docs.google.com/spreadsheets/d/1Sa3F6AP-xQJQQwUu8Rfy8eysvUX3zb113GSvJG7v2Tw/edit#gid=1742227813)

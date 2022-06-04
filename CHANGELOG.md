# Changelog

## [Unreleased]

#### Changes

- Assignment badges now have better colours.
- Overdue assignments now have their dates in red.
- An explanation now shows when assignments are being loaded.

#### Bug Fixes

- Forum posts now have constant width.
- Corrections now open in a new tab instead of a popup window.

## [0.5] - 2022-06-04

#### Features

- Reworked the assignments overview page, now all assignments will be displayed in one page.
  - Links to instructions and corrections are automatically extracted, so you don't have to open an extra popup window.
  - Assignments organised in a Kanban style based on your progress.

#### Known Issues

- Loading texts from each assignment page will break all the French characters. This is not at fault of the font and 
  **I have no way of fixing it**.
- Forum posts shrink in width if they are not longer than one line.

## [0.4] - 2022-05-17

#### Features

- Overhauled the grades overview page, now you can see all your grades in one place.
  - Improved and clearer grade trend graphs.
  - Your Z-Score is now automatically calculated for each course.
  - Newer assessments are now shown first in the list to reduce scrolling.
  - Class stats such as average, median, and standard deviation are now shown near the top to reduce scrolling.

#### Known Issues

- Forum posts shrink in width if they are not longer than one line.
- Roboto does not understand French.

## [0.3.6] - 2022-04-08

Omnivox finally updated and added some quality of life updates to itself. These changes include:
- You can now click on each category on the Léa menu instead of hovering over each of them and then have the options 
  show up.
  - The roll-over menu now has simplified text instead of repeating what's on the option already.
  - Each option is now identifiable with an ID.
- Léa Forum now uses relative instead of absolute time when displaying the post time of forum posts that are close 
  to the current date (yesterday and today).

While I would like to applaud Omnivox for improving their user experience, they did make me work for a bit to adapt 
to these new changes, so here are the bug fixes:

#### Bug Fixes

- Fixed a bug where the Docs button on Léa does not work.
- The script now properly understands "yesterday" and "today" on Forum post dates.

## [0.3.5] - 2022-03-12

#### Bug Fixes

- Fixed a bug where the script does not properly load YouTube links.
- Fixed a bug where the marking non-file documents as read does not work.
- Fixed a bug where document titles with unusually long words can overflow the card.
- Potentially fixed a bug where the lack of a document summary page on the teacher version of Omnivox halts the script.
- Potentially fixed a bug where French Lea halts the script.

## [0.3.4] - 2022-03-03

#### Bug Fixes

- Fixed a bug where adjacent empty text nodes in forum posts would cause duplicated chunks of text. 

## [0.3.3] - 2022-03-03

#### Features

- Automatically presses the login button for you if the username and password have already been entered.

#### Changes

- Used Roboto Slab instead of Roboto Serif as the Serif font for forum posts.

#### Bug Fixes

- Fixed a bug where certain document types don't get their slight colour tint on their icon.

## [0.3.2] - 2022-03-01

#### Changes

- Lea forum posts are now reformatted to have consistent font size and font families.
  - All usage of Sans Serif fonts are converted to Roboto; all usage of Serif fonts are converted to Roboto Serif; 
    all usage of Courier New are converted to Roboto Mono.
  - All text now have 16px font size.
- Lea forum posts now have better formatting for quotation blocks. 

#### Bug Fixes

- Added the reply to subject button to the control panel of forum pages. 

## [0.3.1] - 2022-03-01

#### Features

- Button to scroll to top and bottom in class forums.
- Button to expand and collapse all comments in class forums.

## [0.3] - 2022-02-28

#### Features

- Cleaner Lea forum posts with bigger text and a modern style.
    - Forum post lengths are capped to reduce scrolling, click on the expand button to read more.


## [0.2.1] - 2022-02-28

#### Bug Fixes

- Fixed a bug where link documents do not have their URLs loaded properly on Chrome.


## [0.2] - 2022-02-27

#### Bug Fixes

- Fixed a bug where the Omniplus flower logo does not get used properly on Chrome.


## [0.1] - 2022-02-27

Initial release. 
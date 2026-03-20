# Pattern: tables

## Use this pattern for
- resource lists
- result views
- admin overviews
- pages with bulk actions

## Rules
- keep filters above the table
- keep bulk actions consistent with the rest of the app
- row actions should follow an existing local pattern
- loading, empty, and error states must be explicit
- pagination and sorting should follow existing conventions

## Avoid
- adding a second toolbar pattern
- hiding key actions behind inconsistent menus
- mixing summary widgets directly into dense table controls unless already common in the app
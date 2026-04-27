# PlotShare

PlotShare is a web-based spatial prototype for connecting London allotment plots with three different user groups:

- allotment owners who want to participate in community growing,
- volunteers who want to help while owners are away or collaborate on plots,
- and people or organisations looking to receive surplus food.

The website is built around a map-led exploration workflow. Users can browse allotment plots, filter opportunities by crop, availability, and type of activity, and switch between three main journeys:

- Participate: find plots offering away periods, collaboration slots, or workshops.
- Donate Food: identify plots willing to share surplus produce with food banks or other local recipients.
- Receive Food: browse opportunities to receive available food from allotment plots.


## Data sources

### Allotment locations

London allotment location data was sourced from the London Datastore:

https://data.london.gov.uk/dataset/allotment-locations-248xz/

### Food bank locations

Food bank location data was sourced from Give Food:

https://github.com/givefood/data

### Plot-level data

The plot-level attributes used in the app — such as owner details, crop lists, availability periods, collaboration slots, workshops, and food donation preferences — were generated using an LLM-driven workflow documented in the creation_dataset folder. This generated data is combined with the spatial allotment layer in the app.

## Repository structure

- src/: React application source code
- src/pages/: main user-facing pages
- src/components/: map, filter, and detail components
- public/data/: static geojson and JSON data used by the app
- creation_dataset/: data creation and cleaning workflow, including the plot-generation process

## Notes

- This project is a prototype and includes simulated plot-level content.
- The real-world spatial layers are used together with generated plot data to support the interactive experience.

## Collaborators
@Annalise-lii
@emilydugmore
@eckertniklasm
@jacob-echele

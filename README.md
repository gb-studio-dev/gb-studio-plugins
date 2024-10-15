# GB Studio Official Plugins Repository

Copyright (c) 2024 Chris Maltby, released under the [MIT license](https://opensource.org/licenses/MIT).

Patreon: [gbstudiodev](https://www.patreon.com/gbstudiodev)  
Twitter: [@maltby](https://www.twitter.com/maltby)  
Reddit: [/r/gbstudio](https://www.reddit.com/r/gbstudio)  
Discord: [Join Chat](https://discord.gg/bxerKnc)

## Plugins Repository

The official plugins repository is available at:
https://plugins.gbstudio.dev/repository.json

This URL is hard coded in to GB Studio 4.2.0 and above so shouldn't be needed directly but it's possible to create your own repositories using this same JSON file structure.

## Submitting Plugins

To add your own plugins to the repository create a PR adding your files to `plugins/<your-github-username/organization>/<plugin-name>`.

### plugin.json

Your plugin will need to contain a `plugin.json` file at the root containing the following fields

**type**: One of `assetPack`, `enginePlugin`, `eventsPlugin`, `theme` `lang`, `template` depending on the main purpose of your plugin.

**name**: The name of your plugin

**author**: Your name / username / online handle

**description** A text description of your plugin's purpose. This should only be a few paragraphs long at most, if you need additional detail provide additional documentation with the `url` field.

**version**: The version of your plugin in [SemVer](https://semver.org/) format (e.g. 1.0.0)

**gbsVersion**: The GB Studio version range that your plugin supports (see [SemVer Range Cheatsheet](https://devhints.io/semver))

**license**: The license your plugin code is using

**url** (optional): A URL to access additional documentation or information about your plugin

**images** (optional): An array of image paths to `.png` files within your plugin

### License

As well as including the license field in your `plugin.json` you should also include a text file named `LICENSE` including the full software license for your plugin in the root of the plugin folder.

## Plugin Types

### AssetPack

A project plugin containing additional image, music or sound assets. It is also possible to include `.gbsres` files if added with the name `<asset-filename>.gbsres` (e.g. for `sprites/player.png` the resource file would be located at `sprites/player.png.gbsres` note the double file extension).

### EventsPlugin

A project plugin containing additional event definitions in an `events` folder.

### EnginePlugin

A project plugin containing replacement engine files in an `engine` folder.

### Theme

A globally installed theme plugin that will appear in the `View / Theme` menu.

The plugin must contain a `theme.json` file at the root containing a `name` value (used to display the theme name in the menu), a type `light` or `dark` specifying which inbuilt theme to extend, and key/value pairs containg the theme values to use based on the [inbuilt GB Studio themes](https://github.com/chrismaltby/gb-studio/blob/b578854652b04fcca49f64a1a6dfdc64afb88594/src/components/ui/theme/lightTheme.ts).

### Lang

A globally installed language plugin that will appear in the `View / Language` menu.

The plugin must contain a `lang.json` file at the root containing a `name` value (used to display the language name in the menu) and a list of key/value pairs (see [en.json](https://github.com/chrismaltby/gb-studio/blob/develop/src/lang/en.json)) containing the localised text for each translation key.

It's preferable in most cases for languages to be contributed back to the GB Studio core instead but alternate translations could be added as plugins or this can be used for [translations that aid in creating new localisations](https://github.com/gb-studio-dev/gb-studio-plugins/tree/main/plugins/lang/Debug).

### Template

A globally installed starter template for creating new projects.

The plugin folder structure is identical to a regular project but the `.gbsproj` must be named `project.gbsproj`. You should also include a 256x256px `thumbnail.png` in the plugin root which will be shown when creating a project using this template.

### Multiple Types

While it's technically possible you should try to avoid containing too many types within a single plugin. This allows users to be confident what changes a plugin will make to their project

- `assetPack` shouldn't contain events or engine changes
- `eventsPlugin` can contain assets but shouldn't make engine changes
- `enginePlugin` can also include assets and events if needed

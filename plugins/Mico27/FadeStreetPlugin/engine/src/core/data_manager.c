/*
   This is an empty file to mask the default engine file from GB Studio.
   
   The contents of data_manager.c have been moved to fade_street_data_manager.c

   For plugin developers:

   If your plugin modifies data_manager.c and you would like it to be
   compatible with Fade Street, you can take the follow steps:


   1. #define the constant GF_FADE_STREET_SUPPRESS_DATA_MANAGER in *your*
      plugin's engine.json. This will prevent the definitions in
      fade_street_data_manager.c from being compiled.

   2. Copy fade_street_data_manager.c into your plugin and name it 
      your_plugin_data_manager.c. Remove the #ifndef/#endif surrounding the
      code. Make your changes to that file.

      This will mean that your changes to the file are always compiled when
      your plugin is installed. The Fade Street-specific changes will be 
      compiled if and only if Fade Street is also installed.

   3. Add a dummy data_manager.c to your plugin, just like this. This will
      stop the original unmodified engine.c file from being compiled, while
      preventing files from either plugin from writing over the other.

      You can add an extern declaration like below to suppress warnings.

*/
 
extern char suppress_warning; // suppress warning about empty translation unit


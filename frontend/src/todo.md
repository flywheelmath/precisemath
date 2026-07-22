# classroom management features 
* display last four digits of player uuid as a "session PIN"
  - teacher can look up sessions in database to track live performance

* adjust background color schemes: one palette for authenticated users, another for guest users
  - teacher can see who has logged in and who has not

# adaptive prompt selection
* compute probable range of player skill level
* when the range is wide (player skill level very uncertain):
  - after n correct (incorrect) responses,  adjust the in-session player skill level by 2^n
  - do not count previously seen prompts in streak length
* probably should make the base 2 responsive to the number of skill levels in the skill

# alternative approach to adaptive prompt selection
* instead of player skill profile, define player skill spectrum
* compute accuracy rate acc(n) and speed speed(n) for prompts of level n for each n
  - possibly only include correct responses when computing speed
* use acc(n) and speed(n) to compute fluency(n)
* use fluency(n) to assign weights weight(n) to each skill level
  - highest weight consists of skill levels with fluency closest to 80%

# session duration
* add attributes to skill modules
  - boolean-valued key to enable dynamic duration based on player level
  - default session duration added to interaction maps

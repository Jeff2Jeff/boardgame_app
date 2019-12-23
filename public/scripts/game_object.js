function Game(){
    this.bgg_id = null
    this.title = null
    this.players_min = null
    this.players_max = null
    this.players_age = null
    this.duration_min = null
    this.duration_max = null

    this.summary = function(){
        return(this.title)
    }
}
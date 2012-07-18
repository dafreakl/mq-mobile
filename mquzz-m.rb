require 'rubygems'
gem 'mongoid', '~> 2.4'
require 'sinatra'
require 'mongoid'
require 'json'
require './models/quote'

Mongoid.load!("config/mongoid.yml")

get '/api/v1/quote/:nr' do
  "quote nr: #{params[:nr]}"
end


get '/' do
  @quotes = [
              {:number => 1,  :qdate => '01/01/2012', :titles => ['title 1'], :audiourl => 'mquzz_021', :hints => 'short hint', :hintl => 'long hint'},
              {:number => 2,  :qdate => '01/02/2012', :titles => ['title 2'], :audiourl => 'mquzz_022', :hints => 'short hint 2', :hintl => 'long hint 22222'}
              ]
  haml :index
  
  #content_type :json  
  #all_quotes = Quote.all.first
  #puts "<#{all_quotes.class}>"
  #all_quotes.to_json  
end

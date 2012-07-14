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
  content_type :json
  
  all_quotes = Quote.all.first
  puts "<#{all_quotes.class}>"
  all_quotes.to_json  
end

Rails.application.routes.draw do |map|
  resources :realtime_update
  resources :client_store
end

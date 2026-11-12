Rails.application.routes.draw do
  root "games#index"
  get "word-quest", to: "games#show", as: :word_quest
  get "math-quest", to: "games#math", as: :math_quest
  get "trivia", to: "games#trivia", as: :trivia
  get "spot-the-difference", to: "games#spot_difference", as: :spot_difference
  get "code-breakers", to: "games#code_breaker", as: :code_breaker
  resources :fleet_games, path: "fleet-quest", only: [ :index, :create, :show ], param: :id do
    member do
      get :state
      post :ready
      post :shuffle
      post :fire
    end
  end
  get "fleet-invite/:token", to: "fleet_games#invitation", as: :fleet_invitation
  post "fleet-invite/:token", to: "fleet_games#join"
  mount ActionCable.server => "/cable"
  # Intentionally unlinked from the rest of the site; reached by direct URL only.
  get "read-aloud", to: "games#read_aloud", as: :read_aloud
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end

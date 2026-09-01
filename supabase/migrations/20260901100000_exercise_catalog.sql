create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  muscle_group text not null,
  description text,
  image_url text,
  video_url text,
  created_at timestamptz not null default now()
);

alter table public.workout_exercises
  add column if not exists catalog_exercise_id uuid references public.exercise_catalog (id) on delete set null,
  add column if not exists video_url text;

alter table public.exercise_catalog enable row level security;

create policy "exercise_catalog_select_authenticated"
  on public.exercise_catalog for select to authenticated using (true);

grant select on public.exercise_catalog to authenticated;

insert into public.exercise_catalog (name, muscle_group, description, image_url, video_url) values
('Supino reto', 'Peito', 'Empurre a barra mantendo as escápulas apoiadas e controle na descida.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+supino+reto'),
('Agachamento livre', 'Pernas', 'Desça com controle, joelhos acompanhando a linha dos pés e coluna neutra.', 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+agachamento+livre'),
('Leg press', 'Pernas', 'Mantenha o quadril apoiado e não trave os joelhos ao estender.', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+leg+press'),
('Puxada frontal', 'Costas', 'Puxe em direção ao peito sem balançar o tronco.', 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+puxada+frontal'),
('Remada baixa', 'Costas', 'Mantenha o peito aberto e conduza os cotovelos para trás.', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+remada+baixa'),
('Desenvolvimento de ombros', 'Ombros', 'Empurre os halteres acima da cabeça sem compensar com a lombar.', 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+desenvolvimento+de+ombros'),
('Elevação lateral', 'Ombros', 'Eleve os braços até a linha dos ombros com leve flexão dos cotovelos.', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+eleva%C3%A7%C3%A3o+lateral'),
('Rosca direta', 'Bíceps', 'Mantenha os cotovelos próximos ao corpo durante todo o movimento.', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+rosca+direta'),
('Tríceps na polia', 'Tríceps', 'Estenda os cotovelos sem movimentar os ombros.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+tr%C3%ADceps+na+polia'),
('Stiff', 'Posterior', 'Leve o quadril para trás mantendo a coluna longa e os joelhos semiflexionados.', 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+stiff'),
('Abdominal supra', 'Core', 'Suba o tronco usando o abdômen sem puxar o pescoço.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+abdominal+supra'),
('Prancha', 'Core', 'Sustente o corpo alinhado, contraindo abdômen e glúteos.', 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=800&q=80', 'https://www.youtube.com/results?search_query=como+fazer+prancha')
on conflict (name) do nothing;

insert into public.exercise_catalog (name, muscle_group, description, image_url, video_url) values
('Crucifixo com halteres','Peito','Alongamento e contração do peitoral com controle.','https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=crucifixo+com+halteres'),
('Flexão de braços','Peito','Flexão tradicional com corpo alinhado.','https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=flexao+de+bracos+correta'),
('Barra fixa','Costas','Puxada do corpo com escápulas ativas.','https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=barra+fixa+execucao'),
('Remada curvada','Costas','Remada com coluna neutra e cotovelos próximos.','https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=remada+curvada+execucao'),
('Cadeira extensora','Pernas','Extensão do joelho para quadríceps.','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=cadeira+extensora+execucao'),
('Mesa flexora','Pernas','Flexão dos joelhos para posteriores.','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=mesa+flexora+execucao'),
('Avanço','Pernas','Passada alternada mantendo o joelho alinhado.','https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=avanco+passada+execucao'),
('Elevação pélvica','Glúteos','Extensão de quadril com contração dos glúteos.','https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=elevacao+pelvica+execucao'),
('Panturrilha em pé','Panturrilhas','Elevação dos calcanhares em amplitude confortável.','https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=panturrilha+em+pe+execucao'),
('Rosca martelo','Bíceps','Flexão dos cotovelos com pegada neutra.','https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=rosca+martelo+execucao'),
('Tríceps francês','Tríceps','Extensão dos cotovelos acima da cabeça.','https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=triceps+frances+execucao'),
('Face pull','Ombros','Puxada alta para deltoide posterior e postura.','https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=face+pull+execucao'),
('Mountain climber','Cardio','Movimento dinâmico com core firme.','https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=mountain+climber+execucao'),
('Burpee','Cardio','Sequência de agachamento, apoio e salto.','https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=burpee+execucao'),
('Bicicleta no solo','Core','Rotação alternada do tronco com controle.','https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=900&q=80','https://www.youtube.com/results?search_query=abdominal+bicicleta+execucao')
on conflict (name) do nothing;

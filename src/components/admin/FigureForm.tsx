

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Sparkles, Loader2, Check, ShieldAlert, ThumbsDown, Youtube, X, Plus, Camera } from 'lucide-react';
import { doc, setDoc, serverTimestamp, writeBatch, Timestamp, collection, getDocs, deleteDoc, runTransaction } from 'firebase/firestore';
import { db, callFirebaseFunction } from '@/lib/firebase';
import type { Figure, EmotionKey, AttitudeKey, ProfileType, MediaSubcategory, Hashtag, YoutubeShort, TiktokVideo, InstagramPost } from '@/lib/types';
import slugify from 'slugify'; 
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_OPTIONS } from '@/config/categories';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { CountryCombobox } from '../shared/CountryCombobox';
import { countryCodeToNameMap } from '@/config/countries';
import { DatePicker } from '../shared/DatePicker';
import { Badge } from '../ui/badge';
import { differenceInYears } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import Image from 'next/image';
import { correctMalformedUrl } from '@/lib/utils';
import { OCCUPATION_OPTIONS } from '@/config/occupations';
import { Slider } from '../ui/slider';
import { VIDEO_GAME_GENRES } from '@/config/genres';
import { Combobox } from '../shared/Combobox';
import { searchHashtags } from '@/app/actions/searchHashtagsAction';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';


// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

const generateNameKeywords = (name: string): string[] => {
    if (!name) return [];
    const keywords = new Set<string>();
    const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const words = normalizedName.split(/\s+/).filter(Boolean);

    words.forEach(word => {
        for (let i = 1; i <= word.length; i++) {
            keywords.add(word.substring(0, i));
        }
    });
    return Array.from(keywords);
};

const generateHashtagKeywords = (hashtags: string[]): string[] => {
    if (!hashtags || hashtags.length === 0) return [];
    const keywords = new Set<string>();

    hashtags.forEach(tag => {
        const normalizedTag = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (!normalizedTag) return;
        for (let i = 1; i <= normalizedTag.length; i++) {
            keywords.add(normalizedTag.substring(0, i));
        }
    });

    return Array.from(keywords);
};

interface FigureFormProps {
  initialData?: Figure;
}

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2859 3333" {...props} shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd">
        <path d="M2081 0c55 473 319 755 778 785v532c-266 26-499-61-770-225v995c0 1264-1378 1659-1932 753-356-583-138-1606 1004-1647v561c-87 14-180 36-265 65-254 86-458 249-458 522 0 314 252 566 566 566 314 0 566-252 566-566v-1040h550v-550h-550z" fill="currentColor"/>
    </svg>
);

const MEDIA_SUBCATEGORIES: { value: MediaSubcategory, label: string }[] = [
    { value: 'video_game', label: 'Videojuego' },
    { value: 'movie', label: 'Película' },
    { value: 'series', label: 'Serie' },
    { value: 'anime', label: 'Anime' },
    { value: 'manga_comic', label: 'Manga/Cómic' },
    { value: 'book', label: 'Libro/Novela' },
    { value: 'board_game', label: 'Juegos de mesa' },
    { value: 'animal', label: 'Animales' },
    { value: 'company', label: 'Empresa' },
    { value: 'website', label: 'Página Web' },
    { value: 'social_media_platform', label: 'Red Social' },
];

const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0,
};

const defaultAttitudeCounts: Record<AttitudeKey, number> = {
  neutral: 0, fan: 0, simp: 0, hater: 0,
};

const MARITAL_STATUS_OPTIONS = [
    { value: 'Soltero/a', label: 'Soltero/a' },
    { value: 'Casado/a', label: 'Casado/a' },
    { value: 'Viudo/a', label: 'Viudo/a' },
    { value: 'Divorciado/a', label: 'Divorciado/a' },
    { value: 'Separado/a legalmente', label: 'Separado/a legalmente' },
    { value: 'Conviviente / En unión de hecho', label: 'Conviviente / En unión de hecho' },
];

const MAX_HASHTAGS = 10;

const FigureForm: React.FC<FigureFormProps> = ({ initialData }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('character');
  
  const [socialLinks, setSocialLinks] = useState(initialData?.socialLinks || {});
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [youtubeShorts, setYoutubeShorts] = useState<YoutubeShort[]>([]);
  const [tiktokVideos, setTiktokVideos] = useState<TiktokVideo[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);


  const [isFeatured, setIsFeatured] = useState(false);
  const [nationalityCode, setNationalityCode] = useState('');

  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtagOptions, setHashtagOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(false);


  // Character specific
  const [category, setCategory] = useState('');
  const [occupation, setOccupation] = useState('');
  const [gender, setGender] = useState('');
  const [alias, setAlias] = useState('');
  const [species, setSpecies] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [deathDate, setDeathDate] = useState<Date | undefined>();
  const [birthPlace, setBirthPlace] = useState('');
  const [statusLiveOrDead, setStatusLiveOrDead] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [weight, setWeight] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [distinctiveFeatures, setDistinctiveFeatures] = useState('');
  
  // Media specific
  const [mediaSubcategory, setMediaSubcategory] = useState<MediaSubcategory | undefined>();
  const [mediaGenre, setMediaGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState<Date | undefined>();
  const [developer, setDeveloper] = useState('');
  const [publisher, setPublisher] = useState('');
  const [platformsInput, setPlatformsInput] = useState('');
  const [director, setDirector] = useState('');
  const [studio, setStudio] = useState('');
  const [author, setAuthor] = useState('');
  const [artist, setArtist] = useState('');
  const [founder, setFounder] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const previewImageUrl = correctMalformedUrl(photoUrl);


  const clearCharacterFields = () => {
    setCategory(''); setOccupation(''); setGender(''); setAlias('');
    setSpecies(''); setBirthDate(undefined); setDeathDate(undefined); setBirthPlace('');
    setStatusLiveOrDead(''); setMaritalStatus(''); setHeightCm(undefined); setWeight('');
    setHairColor(''); setEyeColor(''); setDistinctiveFeatures('');
  };

  const clearMediaFields = () => {
    setMediaSubcategory(undefined); setMediaGenre(''); setReleaseDate(undefined); 
    setDeveloper(''); setPublisher(''); setPlatformsInput(''); setDirector(''); setStudio('');
    setAuthor(''); setArtist(''); setFounder(''); setIndustry(''); setWebsiteUrl('');
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setProfileType(initialData.profileType || 'character');
      setDescription(initialData.description || ''); 
      setPhotoUrl(initialData.photoUrl || '');
      setNationalityCode(initialData.nationalityCode || '');
      setIsFeatured(initialData.isFeatured || false);
      setSocialLinks(initialData.socialLinks || {});
      setHashtags(initialData.hashtags || []);

      const fetchCollections = async () => {
        const shortsRef = collection(db, `figures/${initialData.id}/youtubeShorts`);
        const shortsSnap = await getDocs(shortsRef);
        setYoutubeShorts(shortsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as YoutubeShort)));
        
        const tiktoksRef = collection(db, `figures/${initialData.id}/tiktokVideos`);
        const tiktoksSnap = await getDocs(tiktoksRef);
        setTiktokVideos(tiktoksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TiktokVideo)));

        const instagramRef = collection(db, `figures/${initialData.id}/instagramPosts`);
        const instagramSnap = await getDocs(instagramRef);
        setInstagramPosts(instagramSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InstagramPost)));
      };
      fetchCollections();

      if (initialData.profileType === 'character') {
        setCategory(initialData.category || '');
        setOccupation(initialData.occupation || '');
        setGender(initialData.gender || '');
        setAlias(initialData.alias || '');
        setSpecies(initialData.species || '');
        setBirthDate(initialData.birthDateOrAge && !isNaN(new Date(initialData.birthDateOrAge).getTime()) ? new Date(initialData.birthDateOrAge) : undefined);
        setDeathDate(initialData.deathDate && !isNaN(new Date(initialData.deathDate).getTime()) ? new Date(initialData.deathDate) : undefined);
        setBirthPlace(initialData.birthPlace || '');
        setStatusLiveOrDead(initialData.statusLiveOrDead || '');
        setMaritalStatus(initialData.maritalStatus || '');
        setHeightCm(initialData.heightCm);
        setWeight(initialData.weight || '');
        setHairColor(initialData.hairColor || '');
        setEyeColor(initialData.eyeColor || '');
        setDistinctiveFeatures(initialData.distinctiveFeatures || '');
        clearMediaFields();
      } else {
        setMediaSubcategory(initialData.mediaSubcategory);
        setMediaGenre(initialData.mediaGenre || '');
        setReleaseDate(initialData.releaseDate && !isNaN(new Date(initialData.releaseDate).getTime()) ? new Date(initialData.releaseDate) : undefined);
        setDeveloper(initialData.developer || '');
        setPublisher(initialData.publisher || '');
        setPlatformsInput((initialData.platforms || []).join(', '));
        setDirector(initialData.director || '');
        setStudio(initialData.studio || '');
        setAuthor(initialData.author || '');
        setArtist(initialData.artist || '');
        setFounder(initialData.founder || '');
        setIndustry(initialData.industry || '');
        setWebsiteUrl(initialData.websiteUrl || '');
        clearCharacterFields();
      }
    } else {
      // Reset all fields for a new form
      setName(''); 
      setProfileType('character');
      setDescription(''); setPhotoUrl('');
      setNationalityCode(''); setIsFeatured(false); setSocialLinks({}); setHashtags([]); setYoutubeShorts([]); setTiktokVideos([]); setInstagramPosts([]);
      clearCharacterFields();
      clearMediaFields();
    }
  }, [initialData]);

  const debouncedSearchHashtags = useCallback(debounce(async (searchTerm: string) => {
    if (!searchTerm) {
        setHashtagOptions([]);
        setIsLoadingHashtags(false);
        return;
    }
    setIsLoadingHashtags(true);
    const results = await searchHashtags(searchTerm);
    const options = results.map(h => ({ value: h.id, label: `#${h.id}`}));
    setHashtagOptions(options);
    setIsLoadingHashtags(false);
  }, 300), []);

  useEffect(() => {
    debouncedSearchHashtags(hashtagInput);
  }, [hashtagInput, debouncedSearchHashtags]);

  const handleProfileTypeChange = (value: ProfileType) => {
    setProfileType(value);
    if (value === 'character') {
      clearMediaFields();
    } else {
      clearCharacterFields();
    }
  };
  
  const handleAddHashtag = (tagToAdd: string) => {
    if (hashtags.length >= MAX_HASHTAGS) {
        toast({
            title: "Límite de hashtags alcanzado",
            description: `Solo puedes añadir hasta ${MAX_HASHTAGS} hashtags.`,
            variant: "destructive",
        });
        return;
    }
    const trimmedTag = tagToAdd.trim().replace(/#/g, '');
    if (trimmedTag && !hashtags.includes(trimmedTag)) {
        setHashtags(prev => [...prev, trimmedTag]);
    }
    setHashtagInput('');
    setHashtagOptions([]);
  };

  const handleRemoveHashtag = (hashtagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== hashtagToRemove));
  };

  const handleYoutubeShortDelete = async (videoId: string) => {
    if (!initialData) return;
    const shortDocRef = doc(db, `figures/${initialData.id}/youtubeShorts`, videoId);
    await deleteDoc(shortDocRef);
    setYoutubeShorts(youtubeShorts.filter(short => short.id !== videoId));
    toast({ title: "Short eliminado."});
  };
  
  const handleTiktokVideoDelete = async (videoId: string) => {
    if (!initialData) return;
    const tiktokDocRef = doc(db, `figures/${initialData.id}/tiktokVideos`, videoId);
    await deleteDoc(tiktokDocRef);
    setTiktokVideos(tiktokVideos.filter(video => video.id !== videoId));
    toast({ title: "TikTok eliminado."});
  };
  
  const handleInstagramPostDelete = async (postId: string) => {
    if (!initialData) return;
    const postDocRef = doc(db, `figures/${initialData.id}/instagramPosts`, postId);
    await deleteDoc(postDocRef);
    setInstagramPosts(instagramPosts.filter(post => post.id !== postId));
    toast({ title: "Foto de Instagram eliminada."});
  };

  const handleFeatureToggle = async (checked: boolean) => {
    if (!initialData || isSaving) return;
    
    // Optimistically update the UI
    setIsFeatured(checked);
    
    try {
        const figureRef = doc(db, 'figures', initialData.id);
        await runTransaction(db, async (transaction) => {
            transaction.update(figureRef, { isFeatured: checked });
        });

        toast({
            title: "Estado Actualizado",
            description: `${initialData.name} ha sido ${checked ? 'marcado como destacado' : 'desmarcado como destacado'}.`
        });
    } catch (error: any) {
        console.error("Error toggling featured status:", error);
        // Revert optimistic update on error
        setIsFeatured(!checked);
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const nameTrimmed = name.trim();
    if (!nameTrimmed) {
      setError('El nombre del perfil es obligatorio.');
      setIsSaving(false);
      return;
    }

    try {
      const hashtagsLower = hashtags.map(tag => tag.toLowerCase());
      
      const attitudeCounts = { ...defaultAttitudeCounts };
      if(profileType === 'media') {
        delete (attitudeCounts as Partial<typeof attitudeCounts>).simp;
      }

      let calculatedAge: number | null = null;
      if (birthDate) {
        try {
          calculatedAge = differenceInYears(new Date(), birthDate);
        } catch(e) {
          calculatedAge = null;
        }
      }

      // Sanitize the data: convert undefined to null before sending
      const figureData: Partial<Figure> = {
        id: initialData?.id,
        name: nameTrimmed,
        profileType: profileType,
        description: description.trim() || null, 
        photoUrl: photoUrl.trim() || 'https://placehold.co/400x600.png',
        hashtags: hashtags,
        socialLinks: socialLinks,
        isFeatured: isFeatured,
        nationalityCode: nationalityCode || null,
        status: initialData?.status || 'approved',
        nameKeywords: generateNameKeywords(nameTrimmed),
        hashtagKeywords: generateHashtagKeywords(hashtags),
        hashtagsLower: hashtagsLower,
        nationality: countryCodeToNameMap.get(nationalityCode) || null,
        age: calculatedAge,
        height: heightCm ? `${heightCm} cm` : null,
        category: category.trim() || null, 
        occupation: occupation.trim() || null, 
        gender: gender.trim() || null,
        alias: alias.trim() || null, 
        species: species.trim() || null,
        birthDateOrAge: birthDate ? birthDate.toISOString() : null,
        deathDate: deathDate ? deathDate.toISOString() : null,
        birthPlace: birthPlace.trim() || null, 
        statusLiveOrDead: statusLiveOrDead.trim() || null,
        maritalStatus: maritalStatus.trim() || null, 
        heightCm: heightCm || null, 
        weight: weight.trim() || null,
        hairColor: hairColor.trim() || null, 
        eyeColor: eyeColor.trim() || null, 
        distinctiveFeatures: distinctiveFeatures.trim() || null,
        mediaSubcategory: mediaSubcategory || null, 
        mediaGenre: mediaGenre.trim() || null,
        releaseDate: releaseDate ? releaseDate.toISOString() : null,
        developer: developer.trim() || null, 
        publisher: publisher.trim() || null,
        platforms: platformsInput.split(',').map(p => p.trim()).filter(Boolean),
        director: director.trim() || null, 
        studio: studio.trim() || null, 
        author: author.trim() || null, 
        artist: artist.trim() || null,
        founder: founder.trim() || null, 
        industry: industry.trim() || null, 
        websiteUrl: websiteUrl.trim() || null,
        perceptionCounts: initialData?.perceptionCounts || { ...defaultPerceptionCounts },
        attitudeCounts: initialData?.attitudeCounts || attitudeCounts,
        ratingCounts: initialData?.ratingCounts || {},
      };
      
      // Strict sanitization: remove any key with an 'undefined' value
      const sanitizedFigureData = Object.fromEntries(
        Object.entries(figureData).filter(([, value]) => value !== undefined)
      );

      const result = await callFirebaseFunction('saveFigure', sanitizedFigureData);

      setSuccess(result.message || `Perfil "${name}" guardado exitosamente.`);
      
      setTimeout(() => {
        router.push(`/admin/figures`);
        router.refresh(); 
      }, 1500);

    } catch (err: any) {
      console.error("[FigureForm handleSubmit] ERROR en handleSubmit:", err);
      setError(err.message || 'Error al guardar el perfil. Revisa la consola para más detalles.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderMediaFields = () => (
    <div className="space-y-6 animate-in fade-in-50">
        <h3 className="text-lg font-semibold mt-6 border-t pt-4 border-border">Detalles del Medio</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaSubcategory === 'video_game' && (
              <div>
                <Label htmlFor="mediaGenre">Género</Label>
                <Select onValueChange={setMediaGenre} value={mediaGenre}>
                    <SelectTrigger id="mediaGenre"><SelectValue placeholder="Selecciona un género" /></SelectTrigger>
                    <SelectContent>{VIDEO_GAME_GENRES.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            {(mediaSubcategory === 'movie' || mediaSubcategory === 'series' || mediaSubcategory === 'anime' || mediaSubcategory === 'manga_comic' || mediaSubcategory === 'book' || mediaSubcategory === 'board_game') && (
              mediaSubcategory !== 'video_game' && <div><Label htmlFor="mediaGenre">Género</Label><Input id="mediaGenre" value={mediaGenre} onChange={(e) => setMediaGenre(e.target.value)} placeholder="Ej: RPG, Acción, Terror"/></div>
            )}
            <div><Label htmlFor="nationalityCode">País de Origen</Label><CountryCombobox value={nationalityCode} onChange={(v) => setNationalityCode(v || '')}/></div>
            {(mediaSubcategory === 'movie' || mediaSubcategory === 'series' || mediaSubcategory === 'anime' || mediaSubcategory === 'book' || mediaSubcategory === 'video_game' || mediaSubcategory === 'board_game') && (
              <div><Label htmlFor="releaseDate">Fecha de Lanzamiento</Label><DatePicker date={releaseDate} onDateChange={setReleaseDate} /></div>
            )}
            {(mediaSubcategory === 'movie' || mediaSubcategory === 'series' || mediaSubcategory === 'anime') && (
              <div><Label htmlFor="director">Director</Label><Input id="director" value={director} onChange={(e) => setDirector(e.target.value)} /></div>
            )}
             {(mediaSubcategory === 'series' || mediaSubcategory === 'anime') && (
              <div><Label htmlFor="studio">Estudio</Label><Input id="studio" value={studio} onChange={(e) => setStudio(e.target.value)} /></div>
            )}
            {mediaSubcategory === 'video_game' && (
              <>
                <div><Label htmlFor="developer">Desarrollador</Label><Input id="developer" value={developer} onChange={(e) => setDeveloper(e.target.value)} /></div>
                <div><Label htmlFor="publisher">Editor</Label><Input id="publisher" value={publisher} onChange={(e) => setPublisher(e.target.value)} /></div>
              </>
            )}
             {mediaSubcategory === 'video_game' && (
              <div><Label htmlFor="platforms">Plataformas</Label><Input id="platforms" value={platformsInput} onChange={(e) => setPlatformsInput(e.target.value)} placeholder="Ej: PC, PS5, Netflix" /><p className="text-xs text-muted-foreground mt-1">Separar con comas.</p></div>
            )}
            {(mediaSubcategory === 'book' || mediaSubcategory === 'manga_comic' || mediaSubcategory === 'board_game') && (
               <div><Label htmlFor="author">Autor/Escritor</Label><Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
            )}
            {mediaSubcategory === 'manga_comic' && (
                <div><Label htmlFor="artist">Artista/Dibujante</Label><Input id="artist" value={artist} onChange={(e) => setArtist(e.target.value)} /></div>
            )}
            {(mediaSubcategory === 'company' || mediaSubcategory === 'website' || mediaSubcategory === 'social_media_platform') && (
              <div><Label htmlFor="founder">Fundador</Label><Input id="founder" value={founder} onChange={(e) => setFounder(e.target.value)} /></div>
            )}
            {mediaSubcategory === 'company' && (
               <div><Label htmlFor="industry">Industria</Label><Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ej: Tecnología, Automotriz" /></div>
            )}
             {(mediaSubcategory === 'website' || mediaSubcategory === 'social_media_platform') && (
               <div><Label htmlFor="websiteUrl">URL del Sitio</Label><Input id="websiteUrl" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} /></div>
            )}
             {mediaSubcategory === 'animal' && (
              <div><Label htmlFor="species">Especie</Label><Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Ej: Perro, Gato, Caballo" /></div>
            )}
        </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-card rounded-lg shadow-md">
      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div>
          <Label>Tipo de Perfil</Label>
          <RadioGroup
          value={profileType}
          onValueChange={(value) => handleProfileTypeChange(value as ProfileType)}
          className="flex gap-4 mt-2"
          >
          <div className="flex items-center space-x-2">
              <RadioGroupItem value="character" id="type-character" />
              <Label htmlFor="type-character">Personaje</Label>
          </div>
          <div className="flex items-center space-x-2">
              <RadioGroupItem value="media" id="type-media" />
              <Label htmlFor="type-media">Medio</Label>
          </div>
          </RadioGroup>
      </div>


      <h3 className="text-lg font-semibold mt-6 border-t pt-4 border-border">Información Básica</h3>
      <div className="space-y-4">
        <div>
            <Label htmlFor="name">Nombre del Perfil*</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
            <Label htmlFor="photoUrl">URL de la Imagen de Perfil</Label>
            <Input id="photoUrl" type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
            {previewImageUrl && (
              <div className="mt-2">
                <Label>Vista Previa</Label>
                <Image
                  src={previewImageUrl}
                  alt="Vista previa"
                  width={80}
                  height={100}
                  className="rounded object-cover aspect-[4/5] mt-1 bg-muted"
                />
              </div>
            )}
        </div>
        <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        {profileType === 'character' && (
            <div>
                <Label htmlFor="category">Categoría General</Label>
                <Select onValueChange={setCategory} value={category}>
                    <SelectTrigger id="category"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                    <SelectContent>{CATEGORY_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
            </div>
        )}
      </div>
      
      {profileType === 'character' ? (
        <div className="space-y-6 animate-in fade-in-50">
           <h3 className="text-lg font-semibold mt-6 border-t pt-4 border-border">Detalles del Personaje</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Sexo</Label>
                <Select onValueChange={setGender} value={gender}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Selecciona un sexo" /></SelectTrigger>
                    <SelectContent>{GENDER_OPTIONS.map((o) => ((o.value === 'male' || o.value === 'female') && (<SelectItem key={o.value} value={o.label}>{o.label}</SelectItem>)))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <DatePicker date={birthDate} onDateChange={setBirthDate}/>
              </div>
              <div>
                <Label htmlFor="deathDate">Fallecimiento</Label>
                <DatePicker date={deathDate} onDateChange={setDeathDate}/>
              </div>
              <div>
                <Label htmlFor="nationalityCode">Nacionalidad</Label>
                <CountryCombobox value={nationalityCode} onChange={(v) => setNationalityCode(v || '')}/>
              </div>
              <div>
                <Label htmlFor="occupation">Ocupación</Label>
                 <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="maritalStatus">Estado Civil</Label>
                <Select onValueChange={setMaritalStatus} value={maritalStatus}>
                    <SelectTrigger id="maritalStatus"><SelectValue placeholder="Selecciona un estado civil" /></SelectTrigger>
                    <SelectContent>{MARITAL_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="height">{`Altura: ${heightCm ? `${heightCm} cm` : 'No especificada'}`}</Label>
                <Slider
                    id="height"
                    min={40}
                    max={250}
                    step={1}
                    value={heightCm ? [heightCm] : [150]}
                    onValueChange={(value) => setHeightCm(value[0])}
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso (ej. 75 kg)</Label>
                <Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
            </div>
        </div>
      ) : (
        renderMediaFields()
      )}

      <h3 className="text-lg font-semibold mt-6 border-t pt-4 border-border">Redes Sociales y Enlaces</h3>
      <div className="space-y-4">
        <div><Label htmlFor="website">Página Web</Label><Input id="website" value={(socialLinks as Record<string,string>)['website'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, website: e.target.value}))} placeholder="https://..."/></div>
        {profileType === 'media' && mediaSubcategory === 'video_game' && (
          <>
            <div><Label htmlFor="playStoreUrl">Google Play Store</Label><Input id="playStoreUrl" value={(socialLinks as Record<string,string>)['playStoreUrl'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, playStoreUrl: e.target.value}))} placeholder="https://play.google.com/store/..."/></div>
            <div><Label htmlFor="appStoreUrl">Apple App Store</Label><Input id="appStoreUrl" value={(socialLinks as Record<string,string>)['appStoreUrl'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, appStoreUrl: e.target.value}))} placeholder="https://apps.apple.com/..."/></div>
            <div><Label htmlFor="steamUrl">Steam</Label><Input id="steamUrl" value={(socialLinks as Record<string,string>)['steamUrl'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, steamUrl: e.target.value}))} placeholder="https://store.steampowered.com/..."/></div>
          </>
        )}
        <div><Label htmlFor="instagram">Instagram</Label><Input id="instagram" value={(socialLinks as Record<string,string>)['instagram'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, instagram: e.target.value}))} placeholder="https://instagram.com/..."/></div>
        <div><Label htmlFor="twitter">X (Twitter)</Label><Input id="twitter" value={(socialLinks as Record<string,string>)['twitter'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, twitter: e.target.value}))} placeholder="https://x.com/..."/></div>
        <div><Label htmlFor="youtube">YouTube</Label><Input id="youtube" value={(socialLinks as Record<string,string>)['youtube'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, youtube: e.target.value}))} placeholder="https://youtube.com/..."/></div>
        <div><Label htmlFor="facebook">Facebook</Label><Input id="facebook" value={(socialLinks as Record<string,string>)['facebook'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, facebook: e.target.value}))} placeholder="https://facebook.com/..."/></div>
        <div><Label htmlFor="tiktok">TikTok</Label><Input id="tiktok" value={(socialLinks as Record<string,string>)['tiktok'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, tiktok: e.target.value}))} placeholder="https://tiktok.com/@..."/></div>
        <div><Label htmlFor="linkedin">LinkedIn</Label><Input id="linkedin" value={(socialLinks as Record<string,string>)['linkedin'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, linkedin: e.target.value}))} placeholder="https://linkedin.com/..."/></div>
        <div><Label htmlFor="discord">Discord</Label><Input id="discord" value={(socialLinks as Record<string,string>)['discord'] || ''} onChange={(e) => setSocialLinks(prev => ({...prev, discord: e.target.value}))} placeholder="https://discord.gg/..."/></div>
      </div>

      <h3 className="text-lg font-semibold mt-6 border-t pt-4 border-border">Hashtags</h3>
        <div className="space-y-4">
            <div className="flex gap-2">
                <Combobox
                    options={hashtagOptions}
                    value={hashtagInput}
                    onValueChange={setHashtagInput}
                    onSelect={(value) => {
                        if (value) handleAddHashtag(value);
                    }}
                    isLoading={isLoadingHashtags}
                    placeholder="Buscar o crear hashtag..."
                    disabled={hashtags.length >= MAX_HASHTAGS}
                />
                <Button 
                    type="button" 
                    onClick={() => handleAddHashtag(hashtagInput)}
                    disabled={hashtags.length >= MAX_HASHTAGS || !hashtagInput.trim()}
                >
                    <Plus className="h-4 w-4 mr-2" /> Añadir
                </Button>
            </div>
             {hashtags.length >= MAX_HASHTAGS && (
                <p className="text-xs text-destructive">Se ha alcanzado el límite de ${MAX_HASHTAGS} hashtags.</p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
                {hashtags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                        #{tag}
                        <button type="button" onClick={() => handleRemoveHashtag(tag)} className="ml-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive" aria-label={`Eliminar ${tag}`}>
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>

      <div className="space-y-4 mt-6 border-t pt-4 border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Youtube /> Gestión de YouTube Shorts</h3>
           <div className="space-y-2 rounded-lg border p-4">
              <h4 className="font-medium">Videos del Perfil</h4>
              {youtubeShorts.length > 0 ? (
                  youtubeShorts.map((short) => (
                  <div key={short.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Image src={`https://i.ytimg.com/vi/${short.videoId}/hqdefault.jpg`} alt={short.title} width={80} height={45} className="rounded object-cover"/>
                      <div className="flex-grow">
                          <p className="text-sm font-medium">{short.title}</p>
                          <p className="text-xs text-muted-foreground">ID: {short.videoId}</p>
                          <p className="text-xs text-muted-foreground">Reportes: {short.reportedBy?.length || 0}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleYoutubeShortDelete(short.id)}><X /></Button>
                  </div>
                  ))
              ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No hay videos en este perfil.</p>
              )}
          </div>
      </div>
      
      <div className="space-y-4 mt-6 border-t pt-4 border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2"><TikTokIcon className="h-5 w-5" /> Gestión de TikToks</h3>
           <div className="space-y-2 rounded-lg border p-4">
              <h4 className="font-medium">Videos de TikTok del Perfil</h4>
              {tiktokVideos.length > 0 ? (
                  tiktokVideos.map((video) => (
                  <div key={video.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <TikTokIcon className="h-8 w-8 text-foreground" />
                      <div className="flex-grow overflow-hidden">
                          <p className="text-sm font-medium truncate">{video.embedCode}</p>
                          <p className="text-xs text-muted-foreground">Reportes: {video.reportedBy?.length || 0}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleTiktokVideoDelete(video.id)}><X /></Button>
                  </div>
                  ))
              ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No hay videos de TikTok en este perfil.</p>
              )}
          </div>
      </div>
       
      <div className="space-y-4 mt-6 border-t pt-4 border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Camera /> Gestión de Fotos de Instagram</h3>
           <div className="space-y-2 rounded-lg border p-4">
              <h4 className="font-medium">Publicaciones del Perfil</h4>
              {instagramPosts.length > 0 ? (
                  instagramPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Camera className="h-8 w-8 text-foreground" />
                      <div className="flex-grow overflow-hidden">
                          <p className="text-sm font-medium truncate">{post.embedCode}</p>
                          <p className="text-xs text-muted-foreground">Reportes: {post.reportedBy?.length || 0}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleInstagramPostDelete(post.id)}><X /></Button>
                  </div>
                  ))
              ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No hay fotos de Instagram en este perfil.</p>
              )}
          </div>
      </div>
      
      <div className="mt-6 border-t pt-4 border-border">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="isFeatured" 
            checked={isFeatured} 
            onCheckedChange={(checked) => handleFeatureToggle(checked as boolean)} 
            disabled={isSaving || !initialData} 
          />
          <Label htmlFor="isFeatured">Marcar como Perfil Destacado</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? 'Guardando...' : initialData ? 'Actualizar Perfil' : 'Crear Perfil'}
        </Button>
      </div>
    </form>
  );
};

export default FigureForm;

  
